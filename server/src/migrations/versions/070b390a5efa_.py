import sqlalchemy as sa
from alembic import op
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy_utils import generic_relationship

# revision identifiers, used by Alembic.
revision = "070b390a5efa"
down_revision = "871510303302"
branch_labels = None
depends_on = None

Base = declarative_base()
Session = sessionmaker()


class Tag(Base):
    __tablename__ = "tags"
    id = sa.Column(sa.UUID, primary_key=True)
    object_type = sa.Column(sa.Unicode(255))
    object_id = sa.Column(sa.UUID)
    secret = sa.Column(sa.Boolean)
    object = generic_relationship(object_type, object_id)


def upgrade():
    bind = op.get_bind()
    session = Session(bind=bind)

    # Fetch all Tag objects
    tags = session.query(Tag).all()
    for tag in tags:
        if tag.object_type == "User":
            continue
        table_name = f"{tag.object_type.lower()}s"

        # Define the table and columns dynamically
        dynamic_table = sa.table(
            table_name,
            sa.column("id", sa.UUID),
            sa.column("secret", sa.Boolean),
        )

        # Get the related object using the generic relationship
        obj = session.execute(sa.select(dynamic_table.c.secret).where(dynamic_table.c.id == tag.object_id)).fetchone()

        # Update the Tag's secret field if the related object has a secret property
        if obj:
            session.execute(sa.update(Tag).where(Tag.id == tag.id).values(secret=obj.secret))

    session.commit()


def downgrade():
    pass
