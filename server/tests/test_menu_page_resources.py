from models.menu_page import MenuPage


def test_successful_create_menu_page(client, moderator_token):
    menu_page_data = {
        "title": "Glees is closed!",
        "text": "<p>Haha, fooled you!</p>",
    }

    rv = client.post("/api/menu-pages", token=moderator_token, json=menu_page_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["title"] == "Glees is closed!"
    assert res["slug"] == "glees-is-closed"
    assert res["text"] == "<p>Haha, fooled you!</p>"
    assert res["id"] is not None


def test_successful_get_menu_pages(client):
    menu_pages = MenuPage.query.all()

    rv = client.get("/api/menu-pages")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == len(menu_pages)
    for r, mp in zip(sorted(res, key=lambda r: r["id"]), sorted(menu_pages, key=lambda m: str(m.id))):
        assert r["id"] == str(mp.id)
        assert r["slug"] == mp.slug
        assert r["title"] == mp.title
        assert r["text"] == mp.text


def test_successful_get_menu_page(client):
    rv = client.get("/api/menu-pages/legal-notice")
    assert rv.status_code == 200
    res = rv.json
    assert isinstance(res["id"], str)
    assert res["slug"] == "legal-notice"
    assert res["title"] == "Legal Notice"
    assert res["text"] == "<p>Legal notice text goes here.</p>"


def test_get_deleted_menu_page(client):
    rv = client.get("/api/menu-pages/hohenfels")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_menu_page(client, moderator_token):
    rv = client.delete("/api/menu-pages/legal-notice", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_menu_page(client, moderator_token):
    menu_page_data = {
        "title": "Everything except Eifel",
        "text": "is soft graded",
    }

    rv = client.put("/api/menu-pages/legal-notice", token=moderator_token, json=menu_page_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["slug"] == "everything-except-eifel"
    assert res["title"] == "Everything except Eifel"
    assert res["text"] == "is soft graded"
    assert res["id"] is not None
