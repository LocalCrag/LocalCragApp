import pytest

from app import app
from extensions import db
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.release_note_item_type_enum import ReleaseNoteItemTypeEnum
from models.instance_settings import InstanceSettings
from models.notification import Notification
from models.release_note_bundle import ReleaseNoteBundle
from models.release_note_item import ReleaseNoteItem
from models.user import User
from util.release_notes_sync import sync_release_notes_catalog


@pytest.fixture(autouse=True)
def _release_notes_sync_commit_flushes_only(monkeypatch):
    """``sync_release_notes_catalog`` calls ``session.commit()``; tests use a single outer
    transaction (see ``conftest.db_session``). A real commit would end that transaction and
    leak rows into later tests — flush keeps work visible in-session and lets teardown rollback.
    """
    monkeypatch.setattr(db.session, "commit", db.session.flush)


def test_release_notes_first_sync_seeds_without_notifications(monkeypatch):
    monkeypatch.setattr(
        "util.release_notes_sync._load_manifest",
        lambda: {"items": [{"key": "rn-k1", "type": "FIX"}]},
    )
    with app.app_context():
        sync_release_notes_catalog()
        assert ReleaseNoteItem.query.filter_by(item_key="rn-k1").count() == 1
        assert ReleaseNoteItem.query.first().bundle_id is None
        assert ReleaseNoteBundle.query.count() == 0
        assert Notification.query.filter(Notification.type == NotificationTypeEnum.RELEASE_NOTES).count() == 0
        inst = InstanceSettings.return_it()
        assert inst.release_notes_catalog_seeded is True


def test_release_notes_second_sync_creates_bundle_and_notifications(monkeypatch):
    monkeypatch.setattr(
        "util.release_notes_sync._load_manifest",
        lambda: {
            "items": [
                {"key": "rn-k1", "type": "FIX"},
                {"key": "rn-k2", "type": "FEATURE"},
            ]
        },
    )
    with app.app_context():
        inst = InstanceSettings.return_it()
        inst.release_notes_catalog_seeded = True
        db.session.add(inst)
        existing = ReleaseNoteItem()
        existing.item_key = "rn-k1"
        existing.note_type = ReleaseNoteItemTypeEnum.FIX
        existing.bundle_id = None
        db.session.add(existing)
        db.session.flush()

        sync_release_notes_catalog()

        assert ReleaseNoteItem.query.filter_by(item_key="rn-k2").count() == 1
        assert ReleaseNoteBundle.query.count() == 1
        n = Notification.query.filter(Notification.type == NotificationTypeEnum.RELEASE_NOTES).count()
        assert n == User.query.count()


def test_release_notes_creates_in_app_notification_when_mail_opted_out(monkeypatch):
    monkeypatch.setattr(
        "util.release_notes_sync._load_manifest",
        lambda: {
            "items": [
                {"key": "rn-k1", "type": "FIX"},
                {"key": "rn-k3", "type": "FEATURE"},
            ]
        },
    )
    with app.app_context():
        inst = InstanceSettings.return_it()
        inst.release_notes_catalog_seeded = True
        db.session.add(inst)
        existing = ReleaseNoteItem()
        existing.item_key = "rn-k1"
        existing.note_type = ReleaseNoteItemTypeEnum.FIX
        existing.bundle_id = None
        db.session.add(existing)
        member = User.query.filter_by(email="member@localcrag.invalid.org").first()
        member_id = member.id
        member.account_settings.release_notes_notifications_enabled = False
        db.session.add(member.account_settings)
        db.session.flush()

        sync_release_notes_catalog()

        # Mail/digest respects release_notes_notifications_enabled; in-app notification is always created.
        assert (
            Notification.query.filter(
                Notification.type == NotificationTypeEnum.RELEASE_NOTES,
                Notification.user_id == member_id,
            ).count()
            == 1
        )
