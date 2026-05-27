"""add scan fields to clients

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-27
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('clients', sa.Column('scan_phase', sa.String(200), nullable=True))
    op.add_column('clients', sa.Column('scan_quality', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('clients', sa.Column('needs_deep_scan', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('clients', 'needs_deep_scan')
    op.drop_column('clients', 'scan_quality')
    op.drop_column('clients', 'scan_phase')
