"""add folder to knowledge_items

Revision ID: a1b2c3d4e5f6
Revises: f3a1b2c4d5e6
Create Date: 2026-05-27
"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = 'f3a1b2c4d5e6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('knowledge_items', sa.Column('folder', sa.String(200), nullable=True))


def downgrade():
    op.drop_column('knowledge_items', 'folder')
