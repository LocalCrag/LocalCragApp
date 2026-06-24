from sqlalchemy import select
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import declarative_mixin

from extensions import db
from models.secret_topo_entity import SecretTopoEntity

# Staged secret flag for entities that do not have a primary key yet. The registry
# keys on entity_id, but create flows often set ``secret`` before the first flush
# (e.g. ``new_line.secret = area.secret`` in the batch editor). Writing to
# secret_topo_entities immediately would insert NULL and fail; the after_insert
# listener applies the pending value once the row exists.
_SECRET_PENDING_ATTR = "_secret_pending"
_SECRET_CACHE_ATTR = "_secret_cache"


@declarative_mixin
class IsSecret:
    """Secret membership backed by ``secret_topo_entities`` (not a database column).

    Reads and writes use the registry table. New instances without an ``id`` stage
    the intended value in :data:`_SECRET_PENDING_ATTR` until insert; see
    :func:`models.secret_topo_entity.ensure_secret_listeners_registered`.
    """

    @hybrid_property
    def secret(self):
        pending = getattr(self, _SECRET_PENDING_ATTR, None)
        if pending is not None:
            return pending
        cached = getattr(self, _SECRET_CACHE_ATTR, None)
        if cached is not None:
            return cached
        if self.id is None:
            return False
        return db.session.get(SecretTopoEntity, self.id) is not None

    @secret.setter
    def secret(self, value):
        value = bool(value)
        if self.id is None:
            # Entity not persisted yet — registry row needs entity_id (see module note).
            object.__setattr__(self, _SECRET_PENDING_ATTR, value)
            return
        object.__setattr__(self, _SECRET_PENDING_ATTR, None)
        if value:
            SecretTopoEntity.mark(self.id, self.__class__.__name__)
        else:
            SecretTopoEntity.unmark(self.id)

    @secret.expression
    def secret(cls):
        return cls.id.in_(select(SecretTopoEntity.entity_id))


def consume_pending_secret(target) -> bool | None:
    """Return staged secret for ``target`` after insert and clear the staging flag."""
    pending = getattr(target, _SECRET_PENDING_ATTR, None)
    if pending is not None:
        object.__setattr__(target, _SECRET_PENDING_ATTR, None)
    return pending
