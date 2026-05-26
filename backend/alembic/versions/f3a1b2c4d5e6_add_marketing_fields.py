"""add marketing fields to clients

Revision ID: f3a1b2c4d5e6
Revises: e80956c5469f
Create Date: 2026-05-26 10:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'f3a1b2c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e80956c5469f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('clients', sa.Column('marketing_status', sa.String(50), nullable=False, server_default='none'))
    op.add_column('clients', sa.Column('marketing_data', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('clients', 'marketing_data')
    op.drop_column('clients', 'marketing_status')
