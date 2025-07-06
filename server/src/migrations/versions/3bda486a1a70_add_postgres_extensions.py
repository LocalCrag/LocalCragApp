"""empty message

Revision ID: 3bda486a1a70
Revises: 4306dc5f0c18
Create Date: 2025-07-06 17:59:08.195747

"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "3bda486a1a70"
down_revision = "4306dc5f0c18"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')


def downgrade():
    op.execute("DROP EXTENSION IF EXISTS fuzzystrmatch;")
    op.execute('DROP EXTENSION IF EXISTS "uuid-ossp";')
