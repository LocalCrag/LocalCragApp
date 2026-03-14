"""empty message

Revision ID: 7d381d88dc85
Revises: b318163f4e81
Create Date: 2026-03-14 21:30:20.590908

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "7d381d88dc85"
down_revision = "b318163f4e81"
branch_labels = None
depends_on = None

# S3 Base URLs of instances we know of, we can replace those
# Images may have been uploaded to those, before the BUCKET_PLACEHOLDER strategy was implemented
known_deprecated_urls = [
    "https://localcrag-eifel.fra1.digitaloceanspaces.com",
    "https://localcrag-nahetal.fra1.digitaloceanspaces.com",
    "https://localcrag-einstein.fra1.digitaloceanspaces.com",
    "https://s3.topo.mainbloc.de/localcrag",
    "https://s3.gleesbouldering.com/localcrag",
    "https://s3.nahetalbouldering.com/localcrag",
    "https://s3.einstein-topo.de/localcrag",
]


def upgrade():
    connection = op.get_bind()

    # (table_name, column_name) pairs to scan/replace
    targets = [
        ("areas", "short_description"),
        ("areas", "description"),
        ("crags", "short_description"),
        ("crags", "description"),
        ("crags", "rules"),
        ("lines", "description"),
        ("menu_pages", "text"),
        ("posts", "text"),
        ("regions", "description"),
        ("regions", "rules"),
        ("sectors", "short_description"),
        ("sectors", "description"),
        ("sectors", "rules"),
    ]

    # Replace each known base URL with a placeholder. This is intended to make editor
    # content instance-agnostic.
    placeholder = "{{BUCKET_PLACEHOLDER}}"
    for old_url in known_deprecated_urls:
        for table_name, column_name in targets:
            # NOTE: We intentionally use a LIKE filter to avoid rewriting unchanged rows.
            # REPLACE(NULL, ...) stays NULL, so NULL values are safe.
            stmt = sa.text(
                f"""
                UPDATE {table_name}
                SET {column_name} = REPLACE({column_name}, :old, :new)
                WHERE {column_name} LIKE '%' || :old || '%'
                """
            )
            connection.execute(stmt, {"old": old_url, "new": placeholder})


def downgrade():
    pass
