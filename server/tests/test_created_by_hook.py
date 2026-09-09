from app import app
from extensions import db
from models.menu_page import MenuPage
from models.user import User
from util.auth_session import SESSION_COOKIE_NAME


def test_create_sets_created_by_from_request_user(client, moderator_token):
    rv = client.post(
        "/api/menu-pages",
        token=moderator_token,
        json={"title": "Hook Author", "text": "<p>Created by hook.</p>"},
    )
    assert rv.status_code == 201
    page = MenuPage.find_by_id(rv.json["id"])
    moderator = User.find_by_email("moderator@localcrag.invalid.org")
    assert page.created_by_id == moderator.id


def test_hook_does_not_overwrite_existing_created_by(moderator_token):
    admin = User.find_by_email("admin@localcrag.invalid.org")
    moderator = User.find_by_email("moderator@localcrag.invalid.org")
    page = MenuPage()
    page.title = "Preset Author"
    page.text = "<p>Keep this author.</p>"
    page.created_by_id = admin.id

    with app.test_request_context(
        "/",
        method="POST",
        headers={"Cookie": f"{SESSION_COOKIE_NAME}={moderator_token.session_id}"},
    ):
        db.session.add(page)
        db.session.flush()

    assert page.created_by_id == admin.id
    assert page.created_by_id != moderator.id


def test_hook_skips_without_request_context():
    page = MenuPage()
    page.title = "No Request"
    page.text = "<p>No author.</p>"
    db.session.add(page)
    db.session.flush()
    assert page.created_by_id is None
