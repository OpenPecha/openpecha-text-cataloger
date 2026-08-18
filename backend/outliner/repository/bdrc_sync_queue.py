"""Queue operations for bdrc_sync_jobs."""
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from outliner.models.bdrc_sync_job import (
    MAX_ATTEMPTS,
    RETRY_BACKOFF_SECONDS,
    STATE_FAILED,
    STATE_PENDING,
    STATE_RUNNING,
    STATE_SUCCEEDED,
    BdrcSyncJob,
)


def enqueue_sync(
    db: Session,
    document_id: str,
    volume_id: str,
    target_status: str,
    requested_by: Optional[str] = None,
) -> Optional[BdrcSyncJob]:
    """Queue a BDRC push, or retarget the one already queued for this document.

    A partial unique index keeps at most one live job per document.
    """
    existing = (
        db.query(BdrcSyncJob)
        .filter(
            BdrcSyncJob.document_id == document_id,
            BdrcSyncJob.state.in_([STATE_PENDING, STATE_RUNNING]),
        )
        .first()
    )
    if existing is not None:
        # A newer intent supersedes the queued one (e.g. approve after submit).
        existing.target_status = target_status
        existing.volume_id = volume_id
        if existing.state == STATE_PENDING:
            existing.next_attempt_at = None
        db.commit()
        return existing

    job = BdrcSyncJob(
        document_id=document_id,
        volume_id=volume_id,
        target_status=target_status,
        state=STATE_PENDING,
        requested_by=requested_by,
    )
    db.add(job)
    db.commit()
    return job


def claim_next_job(db: Session) -> Optional[BdrcSyncJob]:
    """Atomically take the oldest due pending job and mark it running.

    ``SKIP LOCKED`` keeps this correct if the app is ever run with multiple workers.
    """
    row = db.execute(
        text(
            """
            SELECT id FROM bdrc_sync_jobs
            WHERE state = :pending
              AND (next_attempt_at IS NULL OR next_attempt_at <= :now)
            ORDER BY created_at
            FOR UPDATE SKIP LOCKED
            LIMIT 1
            """
        ),
        {"pending": STATE_PENDING, "now": datetime.utcnow()},
    ).first()
    if row is None:
        db.commit()
        return None

    job = db.get(BdrcSyncJob, row[0])
    job.state = STATE_RUNNING
    job.attempts += 1
    db.commit()
    return job


def mark_succeeded(db: Session, job_id: str) -> None:
    job = db.get(BdrcSyncJob, job_id)
    if job is None:
        return
    job.state = STATE_SUCCEEDED
    job.last_error = None
    job.next_attempt_at = None
    db.commit()


def mark_failed(db: Session, job_id: str, error: str) -> None:
    """Schedule a retry, or give up once the backoff schedule is exhausted."""
    job = db.get(BdrcSyncJob, job_id)
    if job is None:
        return
    job.last_error = error[:2000]
    if job.attempts >= MAX_ATTEMPTS:
        job.state = STATE_FAILED
        job.next_attempt_at = None
    else:
        delay = RETRY_BACKOFF_SECONDS[min(job.attempts - 1, len(RETRY_BACKOFF_SECONDS) - 1)]
        job.state = STATE_PENDING
        job.next_attempt_at = datetime.utcnow() + timedelta(seconds=delay)
    db.commit()


def requeue_stale_running(db: Session, older_than_minutes: int = 30) -> int:
    """Return jobs orphaned by a restart mid-push to pending, so they are retried."""
    cutoff = datetime.utcnow() - timedelta(minutes=older_than_minutes)
    stale = (
        db.query(BdrcSyncJob)
        .filter(BdrcSyncJob.state == STATE_RUNNING, BdrcSyncJob.updated_at < cutoff)
        .all()
    )
    for job in stale:
        job.state = STATE_PENDING
        job.next_attempt_at = None
        job.last_error = "Requeued: worker stopped mid-push"
    if stale:
        db.commit()
    return len(stale)


def requeue_failed_jobs(db: Session) -> int:
    """Return every failed job to pending with its attempt count reset."""
    failed = db.query(BdrcSyncJob).filter(BdrcSyncJob.state == STATE_FAILED).all()
    for job in failed:
        job.state = STATE_PENDING
        job.attempts = 0
        job.next_attempt_at = None
    if failed:
        db.commit()
    return len(failed)


def sync_health_counts(db: Session) -> dict:
    """Queue depth by state."""
    rows = db.execute(
        text("SELECT state, count(*) FROM bdrc_sync_jobs GROUP BY state")
    ).all()
    counts = {state: 0 for state in (STATE_PENDING, STATE_RUNNING, STATE_SUCCEEDED, STATE_FAILED)}
    for state, n in rows:
        counts[state] = int(n)
    return counts


def list_failed_jobs(db: Session, limit: int = 100) -> List[BdrcSyncJob]:
    return (
        db.query(BdrcSyncJob)
        .filter(BdrcSyncJob.state == STATE_FAILED)
        .order_by(BdrcSyncJob.updated_at.desc())
        .limit(limit)
        .all()
    )
