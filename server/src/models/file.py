import logging

from flask import current_app
from sqlalchemy import event
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Session

from extensions import db
from models.base_entity import BaseEntity
from uploader.file_storage import delete_storage_keys, storage_keys_for_deleted_file

logger = logging.getLogger(__name__)

_PENDING_STORAGE_DELETES = "pending_file_storage_deletes"


class File(BaseEntity):
    """
    Model of a file. Video and image files will have thumbnails and height + width. All other will have those fields
    just set to null.
    """

    __tablename__ = "files"

    original_filename = db.Column(db.String(120), nullable=False)
    filename = db.Column(db.String(120), nullable=False)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    thumbnail_xs = db.Column(db.Boolean, nullable=True)
    thumbnail_s = db.Column(db.Boolean, nullable=True)
    thumbnail_m = db.Column(db.Boolean, nullable=True)
    thumbnail_l = db.Column(db.Boolean, nullable=True)
    thumbnail_xl = db.Column(db.Boolean, nullable=True)
    focus_y = db.Column(db.Float, nullable=True)
    exif_lat = db.Column(db.Float, nullable=True)
    exif_lng = db.Column(db.Float, nullable=True)

    @hybrid_property
    def filename_with_host(self):
        if not current_app.config["S3_ENDPOINT"] and not current_app.config["S3_ACCESS_ENDPOINT"]:
            return self.filename
        endpoint = current_app.config["S3_ENDPOINT"]
        if current_app.config["S3_ACCESS_ENDPOINT"]:
            endpoint = current_app.config["S3_ACCESS_ENDPOINT"]
        protocol, host = endpoint.split("://", 1)
        if current_app.config["S3_ADDRESSING"] == "path":
            result = "{}://{}/{}/{}".format(protocol, host, current_app.config["S3_BUCKET"], self.filename)
        else:  # S3_ADDRESSING = 'virtual'
            result = "{}://{}.{}/{}".format(protocol, current_app.config["S3_BUCKET"], host, self.filename)
        return result


def _pending_storage_deletes(session: Session) -> set[str]:
    return session.info.setdefault(_PENDING_STORAGE_DELETES, set())


@event.listens_for(Session, "before_flush")
def collect_deleted_file_storage_keys(session: Session, _flush_context, _instances):
    """Remember storage keys before the DELETE is emitted.

    Objects are removed only after commit, so a rolled-back delete keeps them.
    Attribute access happens here, while the row still exists.
    """
    pending = _pending_storage_deletes(session)
    for instance in session.deleted:
        if isinstance(instance, File):
            pending.update(storage_keys_for_deleted_file(instance.filename))


@event.listens_for(Session, "after_commit")
def delete_committed_file_storage(session: Session):
    keys = session.info.pop(_PENDING_STORAGE_DELETES, None)
    if not keys:
        return
    try:
        delete_storage_keys(keys)
    except Exception:
        logger.exception("Failed to delete storage objects for removed file rows: %s", sorted(keys))


@event.listens_for(Session, "after_rollback")
def discard_pending_file_storage_deletes(session: Session):
    session.info.pop(_PENDING_STORAGE_DELETES, None)
