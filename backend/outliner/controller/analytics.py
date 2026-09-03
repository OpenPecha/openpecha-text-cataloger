"""Dashboard and annotator performance aggregates."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from outliner.repository import outliner_repository as outliner_repo


def get_annotator_performance_breakdown(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Per-annotator metrics for documents whose ``created_at`` falls in the date range.

    When dates are set, outcome metrics (rejections, approvals, review activity, corrections)
    are restricted to segment/rejection timestamps inside the same window so the range is not
    ignored for segment-level counts. Total ``segment_count`` remains all segments on those
    documents (not time-sliced). Optional ``user_id`` limits documents to one annotator (same
    scope as dashboard stats when that filter is applied).
    """
    return outliner_repo.get_annotator_performance_breakdown(
        db, start_date=start_date, end_date=end_date, user_id=user_id
    )


def get_annotator_weekly_quality(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_id: Optional[str] = None,
    bucket_by: str = "reviewed",
) -> List[Dict[str, Any]]:
    """Per-annotator weekly volume and quality rates for the scatter timeline."""
    return outliner_repo.get_annotator_weekly_quality(
        db,
        start_date=start_date,
        end_date=end_date,
        user_id=user_id,
        bucket_by=bucket_by,
    )


def get_dashboard_stats(
    db: Session,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> Dict[str, Any]:
    """Aggregate dashboard statistics, optionally scoped by user and date range."""
    return outliner_repo.get_dashboard_stats(
        db, user_id=user_id, start_date=start_date, end_date=end_date
    )


def list_annotated_pending_review_documents(
    db: Session,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 30,
) -> Dict[str, Any]:
    """Documents behind the dashboard's "Annotated (pending review)" stat, paginated."""
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    skip = (page - 1) * page_size
    rows, total = outliner_repo.list_annotated_pending_review_documents(
        db,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=page_size,
    )
    return {
        "rows": rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": skip + len(rows) < total,
    }
