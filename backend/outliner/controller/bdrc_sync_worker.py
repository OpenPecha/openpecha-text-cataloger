"""Background worker that drains bdrc_sync_jobs.

Because the intent to sync lives in a table, a push interrupted by a crash, deploy or
restart is retried on the next poll rather than lost.
"""
import asyncio
import logging
import threading
import time
from typing import Optional

from core.database import SessionLocal
from bdrc.volume import aclose_http_client
from outliner.controller.bdrc import _push_document_segments_to_bdrc
from outliner.controller.document import get_document
from outliner.repository import bdrc_sync_queue as queue_repo
from outliner.repository import outliner_repository as outliner_repo

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 10
# How often to reclaim jobs abandoned by a restart.
STALE_SWEEP_INTERVAL_SECONDS = 300

_worker_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()


def _run_one_job(db, job) -> None:
    """Push a single job's document, recording success or scheduling a retry."""
    document = get_document(db, job.document_id, include_segments=True)
    if document is None:
        queue_repo.mark_failed(db, job.id, "Document not found")
        return

    async def _push():
        try:
            return await _push_document_segments_to_bdrc(document, job.target_status)
        finally:
            await aclose_http_client()

    asyncio.run(_push())
    queue_repo.mark_succeeded(db, job.id)
    outliner_repo.set_document_synced_to_bdrc(db, job.document_id, True)
    logger.info(
        "BDRC sync job succeeded job_id=%s volume_id=%s target=%s attempts=%s",
        job.id,
        job.volume_id,
        job.target_status,
        job.attempts,
    )


def _process_available_jobs() -> int:
    """Drain currently-due jobs. Returns how many were attempted."""
    processed = 0
    while not _stop_event.is_set():
        db = SessionLocal()
        try:
            job = queue_repo.claim_next_job(db)
            if job is None:
                return processed
            processed += 1
            try:
                _run_one_job(db, job)
            except Exception as exc:  # any failure must schedule a retry
                db.rollback()
                queue_repo.mark_failed(db, job.id, f"{type(exc).__name__}: {exc}")
                outliner_repo.set_document_synced_to_bdrc(db, job.document_id, False)
                logger.warning(
                    "BDRC sync job failed job_id=%s volume_id=%s attempts=%s error=%s",
                    job.id,
                    job.volume_id,
                    job.attempts,
                    exc,
                    exc_info=True,
                )
        finally:
            db.close()
    return processed


def _worker_loop() -> None:
    last_sweep = 0.0
    while not _stop_event.is_set():
        try:
            now = time.monotonic()
            if now - last_sweep > STALE_SWEEP_INTERVAL_SECONDS:
                last_sweep = now
                db = SessionLocal()
                try:
                    requeued = queue_repo.requeue_stale_running(db)
                    if requeued:
                        logger.warning("BDRC sync requeued %s stale running job(s)", requeued)
                finally:
                    db.close()
            _process_available_jobs()
        except Exception:  # the loop must outlive any single failure
            logger.exception("BDRC sync worker loop error")
        _stop_event.wait(POLL_INTERVAL_SECONDS)


def start_worker() -> None:
    """Start the queue worker (called once from app startup)."""
    global _worker_thread
    if _worker_thread is not None and _worker_thread.is_alive():
        return
    _stop_event.clear()
    _worker_thread = threading.Thread(
        target=_worker_loop, name="bdrc-sync-worker", daemon=True
    )
    _worker_thread.start()
    logger.info("BDRC sync worker started (poll=%ss)", POLL_INTERVAL_SECONDS)


def stop_worker(timeout: float = 5.0) -> None:
    """Signal the worker to stop; an in-flight job is requeued by the stale sweep."""
    _stop_event.set()
    if _worker_thread is not None:
        _worker_thread.join(timeout=timeout)
    logger.info("BDRC sync worker stopped")
