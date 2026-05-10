from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

from extensions import db
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.release_note_item_type_enum import ReleaseNoteItemTypeEnum
from models.instance_settings import InstanceSettings
from models.release_note_bundle import ReleaseNoteBundle
from models.release_note_item import ReleaseNoteItem
from models.user import User
from util.notifications import create_notification_for_user


def _load_manifest() -> dict[str, Any]:
    path = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "data", "release_notes_manifest.json"))
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _manifest_rows(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """Build rows from manifest JSON. Structure is validated in CI (see validate_release_notes_manifest.py)."""
    return [{"key": row["key"], "type": ReleaseNoteItemTypeEnum(row["type"])} for row in raw["items"]]


def _sync_release_notes_catalog_impl() -> None:
    """Import manifest entries, optionally create one bundle + per-user notifications (idempotent).

    Requires an active Flask application context.
    """
    try:
        instance = InstanceSettings.return_it()
        if not instance:
            return

        if instance.instance_launched_at is None:
            instance.instance_launched_at = datetime.now(timezone.utc)
            db.session.add(instance)

        manifest_rows = _manifest_rows(_load_manifest())
        existing_keys = {row[0] for row in db.session.query(ReleaseNoteItem.item_key).all()}
        to_add = [row for row in manifest_rows if row["key"] not in existing_keys]

        if not to_add:
            db.session.commit()
            return

        if not instance.release_notes_catalog_seeded:
            for row in to_add:
                item = ReleaseNoteItem()
                item.item_key = row["key"]
                item.note_type = row["type"]
                item.bundle_id = None
                db.session.add(item)
            instance.release_notes_catalog_seeded = True
            db.session.add(instance)
            db.session.commit()
            return

        bundle = ReleaseNoteBundle()
        db.session.add(bundle)
        db.session.flush()

        for row in to_add:
            item = ReleaseNoteItem()
            item.item_key = row["key"]
            item.note_type = row["type"]
            item.bundle_id = bundle.id
            db.session.add(item)

        for user in User.query.all():
            db.session.add(
                create_notification_for_user(
                    user.id,
                    NotificationTypeEnum.RELEASE_NOTES,
                    entity_type="release_note_bundle",
                    entity_id=bundle.id,
                )
            )

        db.session.commit()
    except Exception:
        db.session.rollback()
        raise


def sync_release_notes_catalog() -> None:
    """Run release-note manifest sync inside the Flask app context."""
    from app import app as flask_app

    with flask_app.app_context():
        _sync_release_notes_catalog_impl()
