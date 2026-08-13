"""add is_complete to outliner_documents

Revision ID: d1c2b3a4e5f6
Revises: c9e1f3a5b7d0
Create Date: 2026-08-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d1c2b3a4e5f6"
down_revision: Union[str, Sequence[str], None] = "c9e1f3a5b7d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Mirrors BDRC's volume-level `complete` flag, which defaults to true there:
    # existing documents backfill to complete.
    op.add_column(
        "outliner_documents",
        sa.Column(
            "is_complete",
            sa.Boolean(),
            nullable=True,
            server_default=sa.true(),
        ),
    )


def downgrade() -> None:
    op.drop_column("outliner_documents", "is_complete")
