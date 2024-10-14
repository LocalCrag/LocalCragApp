from models.menu_page import MenuPage


def test_successful_create_menu_page(client, moderator_token):
    menu_page_data = {
        "title": "Glees ist gesperrt!",
        "text": "<p>Haha, verarscht!</p>",
    }

    rv = client.post("/api/menu-pages", token=moderator_token, json=menu_page_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["title"] == "Glees ist gesperrt!"
    assert res["slug"] == "glees-ist-gesperrt"
    assert res["text"] == "<p>Haha, verarscht!</p>"
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
    rv = client.get("/api/menu-pages/impressum")
    assert rv.status_code == 200
    res = rv.json
    assert isinstance(res["id"], str)
    assert res["slug"] == "impressum"
    assert res["title"] == "Impressum"
    assert res["text"] == "<p>Hier steht ein Impressums Text.</p>"


def test_get_deleted_menu_page(client):
    rv = client.get("/api/menu-pages/hohenfels")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_menu_page(client, moderator_token):
    rv = client.delete("/api/menu-pages/impressum", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_menu_page(client, moderator_token):
    menu_page_data = {
        "title": "Alles außer Eifel",
        "text": "ist soft bewertet",
    }

    rv = client.put("/api/menu-pages/impressum", token=moderator_token, json=menu_page_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["slug"] == "alles-ausser-eifel"
    assert res["title"] == "Alles außer Eifel"
    assert res["text"] == "ist soft bewertet"
    assert res["id"] is not None
