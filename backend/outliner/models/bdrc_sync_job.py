"""ORM model for bdrc_sync_jobs."""
from __future__ import annotations

from datetime import datetime
import uuid

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base

STATE_PENDING = "pending"
STATE_RUNNING = "running"
STATE_SUCCEEDED = "succeeded"
STATE_FAILED = "failed"

# Backoff between attempts, in seconds; a job that exhausts these is marked failed.
RETRY_BACKOFF_SECONDS = [60, 300, 900, 3600, 21600]
MAX_ATTEMPTS = len(RETRY_BACKOFF_SECONDS) + 1


class BdrcSyncJob(Base):
    """One queued push of a document's segments to BDRC.

    Written inside the approve/skip request so the intent to sync survives a restart.
    """

    __tablename__ = "bdrc_sync_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    volume_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    target_status: Mapped[str] = mapped_column(String, nullable=False)

    state: Mapped[str] = mapped_column(String, nullable=False, default=STATE_PENDING)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_attempt_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_by: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
