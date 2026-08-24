"""add marked_spans to segment_rejections

Lets a reviewer mark the exact wrong text inside a segment when rejecting it.
Shape: [{"start": int, "end": int, "note": str | null}, ...] with document-absolute offsets,
so a mark survives the segment being split.

Revision ID: a3e8c91d4f27
Revises: c4f7a2e19b83
"""
from alembic import op
import sqlalchemy as sa


revision = "a3e8c91d4f27"
down_revision = "c4f7a2e19b83"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "segment_rejections",
        sa.Column("marked_spans", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("segment_rejections", "marked_spans")
