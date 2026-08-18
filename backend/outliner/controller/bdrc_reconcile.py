"""Reconciliation of outliner documents against BDRC.

The sync queue retries pushes it knows about; this catches drift it cannot know about,
such as volumes changed directly on BDRC or pushes lost before the queue existed.
"""
import logging
from typing import Dict, List

from sqlalchemy import text

from bdrc.volume import get_volumes
from core.database import SessionLocal
from outliner.repository import bdrc_sync_queue

logger = logging.getLogger(__name__)

# Local document status -> the BDRC status it should have once synced.
EXPECTED_BDRC_STATUS = {
    "approved": "reviewed",
    "completed": "in_review",
    "skipped": "skipped",
}


def _fetch_bdrc_statuses(statuses: List[str]) -> Dict[str, str]:
    """Map volume_id -> BDRC status (the list endpoint caps at 200 per page)."""
    import asyncio

    async def _collect() -> Dict[str, str]:
        out: Dict[str, str] = {}
        for status in statuses:
            offset = 0
            while True:
                page = await get_volumes(status=status, offset=offset, limit=200)
                items = page.get("items") or []
                for item in items:
                    if item.get("id"):
                        out[item["id"]] = item.get("status")
                offset += len(items)
                if not items or offset >= int(page.get("total") or 0):
                    break
        return out

    return asyncio.run(_collect())


def reconcile_documents_with_bdrc(enqueue: bool = True) -> Dict[str, object]:
    """Compare every finished document against BDRC and queue a push for anything drifted.

    ``enqueue=False`` reports drift without changing anything.
    """
    db = SessionLocal()
    try:
        rows = db.execute(
            text(
                """
                SELECT id, filename, status
                FROM outliner_documents
                WHERE status IN ('approved', 'completed', 'skipped')
                  AND filename IS NOT NULL AND btrim(filename) <> ''
                """
            )
        ).all()

        bdrc_status_by_volume = _fetch_bdrc_statuses(
            ["reviewed", "in_review", "skipped", "in_progress", "active"]
        )

        drifted: List[Dict[str, str]] = []
        unknown = 0
        for doc_id, volume_id, local_status in rows:
            expected = EXPECTED_BDRC_STATUS.get(local_status)
            actual = bdrc_status_by_volume.get(volume_id)
            if actual is None:
                unknown += 1
                continue
            if actual != expected:
                drifted.append(
                    {
                        "document_id": doc_id,
                        "volume_id": volume_id,
                        "local_status": local_status,
                        "bdrc_status": actual,
                        "expected": expected,
                    }
                )

        queued = 0
        if enqueue:
            for d in drifted:
                bdrc_sync_queue.enqueue_sync(
                    db,
                    document_id=d["document_id"],
                    volume_id=d["volume_id"],
                    target_status=d["expected"],
                    requested_by="reconciliation",
                )
                queued += 1

        if drifted:
            logger.warning(
                "BDRC reconciliation found %s drifted volume(s); queued=%s", len(drifted), queued
            )
        else:
            logger.info("BDRC reconciliation: all %s documents in sync", len(rows))

        return {
            "checked": len(rows),
            "drifted": len(drifted),
            "queued": queued,
            "not_found_on_bdrc": unknown,
            "details": drifted[:100],
        }
    finally:
        db.close()
