"""atlas global knowledge items

Revision ID: c3d4e5f6a7b8
Revises: a1b2c3d4e5f6
Create Date: 2026-05-27
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('knowledge_items', sa.Column('is_global', sa.Boolean(), nullable=False, server_default='false'))
    op.alter_column('knowledge_items', 'client_id', nullable=True)


def downgrade():
    op.alter_column('knowledge_items', 'client_id', nullable=False)
    op.drop_column('knowledge_items', 'is_global')
