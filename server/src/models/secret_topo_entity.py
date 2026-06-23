from sqlalchemy import event
from sqlalchemy.dialects.postgresql import UUID

from extensions import db

SECRET_TOPO_ENTITY_TYPES = frozenset({"Crag", "Sector", "Area", "Line"})


class SecretTopoEntity(db.Model):
    """
    Registry of topo entities that are marked secret.

    This table is the sole source of truth for secret membership. Topo models
    expose ``secret`` via the :class:`~models.mixins.is_secret.IsSecret` hybrid property.
    """

    __tablename__ = "secret_topo_entities"

    entity_id = db.Column(UUID(), primary_key=True)
    entity_type = db.Column(db.String(32), nullable=False)

    @classmethod
    def mark(cls, entity_id, entity_type: str):
        if entity_id is None:
            return
        if db.session.get(cls, entity_id) is None:
            db.session.add(cls(entity_id=entity_id, entity_type=entity_type))

    @classmethod
    def unmark(cls, entity_id):
        if entity_id is None:
            return
        entry = db.session.get(cls, entity_id)
        if entry is not None:
            db.session.delete(entry)


def _topo_entity_types():
    from models.area import Area
    from models.crag import Crag
    from models.line import Line
    from models.sector import Sector

    return (Crag, "Crag"), (Sector, "Sector"), (Area, "Area"), (Line, "Line")


def _register_secret_insert_listeners():
    """Write registry rows for new topo entities that staged secret before insert."""
    from models.mixins.is_secret import consume_pending_secret

    for model, entity_type in _topo_entity_types():

        @event.listens_for(model, "after_insert")
        def apply_pending_secret(mapper, connection, target, entity_type=entity_type):
            pending = consume_pending_secret(target)
            if pending:
                connection.execute(
                    SecretTopoEntity.__table__.insert(),
                    {"entity_id": target.id, "entity_type": entity_type},
                )


_listeners_registered = False


def ensure_secret_listeners_registered():
    """Register after_insert listeners once all topo models are importable."""
    global _listeners_registered
    if _listeners_registered:
        return
    _register_secret_insert_listeners()
    _listeners_registered = True


@event.listens_for(db.session, "before_flush")
def cleanup_deleted_secret_registry_entries(session, flush_context, instances):
    topo_types = tuple(model for model, _ in _topo_entity_types())
    for entity in session.deleted:
        if isinstance(entity, topo_types):
            SecretTopoEntity.unmark(entity.id)
