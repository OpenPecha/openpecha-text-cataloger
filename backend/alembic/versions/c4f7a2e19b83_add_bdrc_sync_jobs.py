"""add bdrc_sync_jobs

Durable queue for BDRC volume pushes, so an interrupted push is retried instead of lost.

Revision ID: c4f7a2e19b83
Revises: d1c2b3a4e5f6
"""
from alembic import op
import sqlalchemy as sa


revision = "c4f7a2e19b83"
down_revision = "d1c2b3a4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "bdrc_sync_jobs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("document_id", sa.String(), nullable=False, index=True),
        sa.Column("volume_id", sa.String(), nullable=False, index=True),
        # in_review | reviewed | skipped
        sa.Column("target_status", sa.String(), nullable=False),
        # pending | running | succeeded | failed
        sa.Column("state", sa.String(), nullable=False, server_default="pending"),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("next_attempt_at", sa.DateTime(), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("requested_by", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    # Serves the worker's claim query.
    op.create_index(
        "ix_bdrc_sync_jobs_claim",
        "bdrc_sync_jobs",
        ["state", "next_attempt_at"],
    )
    # At most one live job per document.
    op.create_index(
        "uq_bdrc_sync_jobs_active_document",
        "bdrc_sync_jobs",
        ["document_id"],
        unique=True,
        postgresql_where=sa.text("state IN ('pending', 'running')"),
    )


def downgrade() -> None:
    op.drop_index("uq_bdrc_sync_jobs_active_document", table_name="bdrc_sync_jobs")
    op.drop_index("ix_bdrc_sync_jobs_claim", table_name="bdrc_sync_jobs")
    op.drop_table("bdrc_sync_jobs")
