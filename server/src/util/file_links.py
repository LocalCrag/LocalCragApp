"""Link files that are embedded in rich text, and delete rows nothing references.

Rich-text editors store an image URL, not a foreign key. After the owning row
is persisted, links are written for the storage filenames found in that HTML.
Which models participate is read from mapped Text columns and from foreign keys
to files.id, so a new model is included without registering it here.
A one-time migration backfill uses the same parser. Cleanup then deletes file
rows that no foreign key and no link point at.
"""

from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timedelta
from html import unescape

import pytz
from sqlalchemy import Text, event, inspect, select, text
from sqlalchemy.orm import Session

from extensions import db
from models.file import File
from models.file_link import FileLink
from uploader.file_storage import THUMBNAIL_SIZES

logger = logging.getLogger(__name__)

MIN_UNATTACHED_AGE = timedelta(
    days=7
)  # Keep files for at least a week after deletion, prevents deleting files while editors are still editing them
_PENDING_LINK_SYNC = "pending_file_link_sync"
_listeners_registered = False
_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

_ATTR_URLS = re.compile(r"""(?:src|srcset)\s*=\s*["']([^"']+)["']""", re.I)
_UUID_STEM = re.compile(
    r"^(?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$"
)


def register_listeners() -> None:
    global _listeners_registered
    if _listeners_registered:
        return
    event.listens_for(Session, "before_flush")(_collect_file_link_sync)
    event.listens_for(Session, "after_flush")(_apply_file_link_sync)
    event.listens_for(Session, "after_rollback")(_discard_file_link_sync)
    _listeners_registered = True


def original_filenames_in_html(html: str | None) -> set[str]:
    """Storage filenames referenced by img src or srcset values in HTML."""
    if not html:
        return set()
    found = set()
    for match in _ATTR_URLS.finditer(html):
        for piece in unescape(match.group(1)).split(","):
            token = piece.strip().split(" ")[0] if piece.strip() else ""
            if not token:
                continue
            key = token.split("?")[0].split("#")[0].rstrip("/").rsplit("/", 1)[-1]
            if key:
                found.add(_normalize_storage_filename(key))
    return found


def embedded_file_fields() -> dict[type, tuple[str, ...]]:
    """Text columns on mapped models. Rich text that can embed a file URL lives in these."""
    owners: dict[str, tuple[type, tuple[str, ...]]] = {}
    for mapper in db.Model.registry.mappers:
        table = mapper.local_table
        if table is None or "id" not in table.c:
            continue
        fields = tuple(
            attr.key
            for attr in mapper.column_attrs
            if len(attr.columns) == 1
            and attr.columns[0].table is table
            and isinstance(attr.columns[0].type, Text)
            and _IDENTIFIER.match(attr.key)
        )
        if not fields:
            continue
        # Single-table subclasses share the base table. Keep the base mapper.
        current = owners.get(table.name)
        if current is None or mapper.inherits is None:
            owners[table.name] = (mapper.class_, fields)
    return {model: fields for model, fields in owners.values()}


def file_reference_tables() -> tuple[tuple[str, str], ...]:
    """Tables and columns with a foreign key to files.id, excluding file_links itself."""
    references = []
    for table in db.metadata.tables.values():
        if table.name in {"files", "file_links"} or not _IDENTIFIER.match(table.name):
            continue
        for column in table.columns:
            if not _IDENTIFIER.match(column.name):
                continue
            if any(fk.column.table.name == "files" and fk.column.name == "id" for fk in column.foreign_keys):
                references.append((table.name, column.name))
    return tuple(references)


def backfill_file_links(connection) -> int:
    """Insert file_links for filenames already embedded in stored HTML."""
    filenames = {
        row.filename: row.id for row in connection.execute(text("SELECT id, filename FROM files")).all() if row.filename
    }
    inserted = 0
    for model, fields in embedded_file_fields().items():
        if not _IDENTIFIER.match(model.__tablename__):
            continue
        columns = ", ".join(["id", *fields])
        rows = connection.execute(text(f"SELECT {columns} FROM {model.__tablename__}")).mappings()
        for row in rows:
            for field in fields:
                for filename in original_filenames_in_html(row[field]):
                    file_id = filenames.get(filename)
                    if file_id is None:
                        continue
                    result = connection.execute(
                        text(
                            "INSERT INTO file_links (id, file_id, object_type, object_id, field_name) "
                            "VALUES (:id, :file_id, :object_type, :object_id, :field_name) "
                            "ON CONFLICT ON CONSTRAINT uq_file_links_reference DO NOTHING"
                        ),
                        {
                            "id": uuid.uuid4(),
                            "file_id": file_id,
                            "object_type": model.__name__,
                            "object_id": row["id"],
                            "field_name": field,
                        },
                    )
                    inserted += result.rowcount or 0
    logger.info("Backfilled %s file link(s).", inserted)
    return inserted


def delete_unattached_files(now: datetime | None = None) -> int:
    """Delete file rows nothing references, once they are at least a day old."""
    file_ids = (
        db.session.execute(
            text(f"SELECT files.id FROM files WHERE {unattached_files_where_sql()}"),
            {"cutoff": _cutoff(now)},
        )
        .scalars()
        .all()
    )
    if not file_ids:
        logger.info("Deleted 0 unattached file row(s).")
        return 0
    rows = db.session.query(File).filter(File.id.in_(file_ids)).all()
    for row in rows:
        db.session.delete(row)
    db.session.commit()
    logger.info("Deleted %s unattached file row(s).", len(rows))
    return len(rows)


def delete_unattached_file_rows(connection, now: datetime | None = None) -> list[str]:
    """Delete unattached file rows on an existing connection and return their storage names."""
    result = connection.execute(
        text(f"DELETE FROM files WHERE {unattached_files_where_sql()} RETURNING filename"),
        {"cutoff": _cutoff(now)},
    )
    filenames = [row.filename for row in result if row.filename]
    logger.info("Deleted %s unattached file row(s).", len(filenames))
    return filenames


def unattached_files_where_sql() -> str:
    clauses = ["(files.time_created IS NULL OR files.time_created < :cutoff)"]
    for table, column in file_reference_tables():
        clauses.append("NOT EXISTS (SELECT 1 FROM " f"{table} AS attachment WHERE attachment.{column} = files.id)")
    clauses.append("NOT EXISTS (SELECT 1 FROM file_links WHERE file_links.file_id = files.id)")
    return " AND ".join(clauses)


def _normalize_storage_filename(key: str) -> str:
    stem, dot, extension = key.rpartition(".")
    if not dot:
        return key
    for size in sorted(THUMBNAIL_SIZES, key=len, reverse=True):
        suffix = f"_{size}"
        if not stem.endswith(suffix):
            continue
        base = stem[: len(stem) - len(suffix)]
        if _UUID_STEM.match(base):
            return f"{base}.{extension}"
        return key
    return key


def _cutoff(now: datetime | None) -> datetime:
    moment = now or datetime.now(pytz.utc)
    if moment.tzinfo is not None:
        moment = moment.astimezone(pytz.utc).replace(tzinfo=None)
    return moment - MIN_UNATTACHED_AGE


def _collect_file_link_sync(session: Session, _flush_context, _instances) -> None:
    pending = session.info.setdefault(_PENDING_LINK_SYNC, [])
    fields_by_model = embedded_file_fields()
    deleted = {id(obj) for obj in session.deleted}
    for obj in list(session.new) + list(session.dirty):
        if id(obj) in deleted:
            continue
        fields = _changed_embedded_fields(obj, is_new=obj in session.new, fields_by_model=fields_by_model)
        if fields:
            pending.append((obj, fields))
    for obj in session.deleted:
        if obj.id is not None and type(obj) in fields_by_model:
            pending.append((obj, None))


def _apply_file_link_sync(session: Session, _flush_context) -> None:
    pending = session.info.pop(_PENDING_LINK_SYNC, None)
    if not pending:
        return
    for obj, fields in pending:
        if fields is None:
            _delete_owner_links(session, obj)
        else:
            _sync_owner_fields(session, obj, fields)


def _discard_file_link_sync(session: Session) -> None:
    session.info.pop(_PENDING_LINK_SYNC, None)


def _changed_embedded_fields(obj, is_new: bool, fields_by_model: dict[type, tuple[str, ...]]) -> tuple[str, ...]:
    fields = fields_by_model.get(type(obj))
    if not fields:
        return ()
    if is_new:
        return tuple(field for field in fields if getattr(obj, field))
    state = inspect(obj)
    return tuple(field for field in fields if state.attrs[field].history.has_changes())


def _sync_owner_fields(session: Session, owner, fields: tuple[str, ...]) -> None:
    if owner.id is None:
        return
    for field in fields:
        desired_names = original_filenames_in_html(getattr(owner, field))
        desired_ids = set()
        if desired_names:
            desired_ids = set(session.scalars(select(File.id).where(File.filename.in_(desired_names))).all())
        existing = (
            session.query(FileLink)
            .filter_by(object_type=type(owner).__name__, object_id=owner.id, field_name=field)
            .all()
        )
        for link in existing:
            if link.file_id not in desired_ids:
                session.delete(link)
        present = {link.file_id for link in existing}
        for file_id in desired_ids - present:
            link = FileLink(file_id=file_id, field_name=field)
            link.object = owner
            session.add(link)


def _delete_owner_links(session: Session, owner) -> None:
    links = session.query(FileLink).filter_by(object_type=type(owner).__name__, object_id=owner.id).all()
    for link in links:
        session.delete(link)
