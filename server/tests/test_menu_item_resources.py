from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.menu_item import MenuItem
from models.menu_page import MenuPage


def test_successful_create_menu_item(client, moderator_token):
    menu_page = MenuPage.find_by_slug("impressum")

    menu_item_data = {
        "type": "MENU_PAGE",
        "position": "BOTTOM",
        "menuPage": str(menu_page.id),
        "icon": "test",
        "title": None,
        "url": None,
    }

    rv = client.post("/api/menu-items", token=moderator_token, json=menu_item_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["type"] == "MENU_PAGE"
    assert res["position"] == "BOTTOM"
    assert res["orderIndex"] == 2
    assert res["icon"] == "test"
    assert res["menuPage"]["title"] == menu_page.title
    assert res["id"] is not None


def test_successful_create_url_menu_item(client, moderator_token):

    menu_item_data = {
        "type": "URL",
        "position": "TOP",
        "menuPage": None,
        "url": "test-url",
        "title": "title test",
        "icon": "test",
    }

    rv = client.post("/api/menu-items", token=moderator_token, json=menu_item_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["type"] == "URL"
    assert res["position"] == "TOP"
    assert res["orderIndex"] == 4
    assert res["icon"] == "test"
    assert res["title"] == "title test"
    assert res["url"] == "test-url"
    assert res["menuPage"] is None
    assert res["id"] is not None


def test_successful_get_menu_items(client):
    rv = client.get("/api/menu-items")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 6
    assert isinstance(res[1]["id"], str)
    assert res[1]["type"] == "NEWS"
    assert res[1]["position"] == "TOP"
    assert res[1]["orderIndex"] == 0
    assert res[1]["menuPage"] == None
    assert res[1]["icon"] == None


def test_successful_get_menu_item(client):
    menu_item = MenuItem.query.filter_by(type=MenuItemTypeEnum.NEWS).first()

    rv = client.get(f"/api/menu-items/{menu_item.id}")
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == str(menu_item.id)
    assert res["type"] == "NEWS"
    assert res["position"] == "TOP"
    assert res["orderIndex"] == 0
    assert res["menuPage"] == None
    assert res["icon"] == None


def test_get_deleted_menu_item(client):
    rv = client.get("/api/menu-items/6b99766e-4597-492f-a8f1-450f1af7cfa2")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_menu_item(client, moderator_token):
    menu_item = MenuItem.query.filter_by(type=MenuItemTypeEnum.NEWS).first()

    rv = client.delete(f"/api/menu-items/{menu_item.id}", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_menu_item(client, moderator_token):
    menu_page = MenuPage.find_by_slug("impressum")
    menu_item = MenuItem.query.filter_by(menu_page_id=menu_page.id).first()

    menu_item_data = {
        "type": "MENU_PAGE",
        "position": "BOTTOM",
        "menuPage": str(menu_page.id),
        "icon": None,
        "title": None,
        "url": None,
    }

    rv = client.put(f"/api/menu-items/{menu_item.id}", token=moderator_token, json=menu_item_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["type"] == "MENU_PAGE"
    assert res["position"] == "BOTTOM"
    assert res["icon"] == None
    assert res["menuPage"]["title"] == menu_page.title
    assert res["id"] == str(menu_item.id)


def test_successful_order_menu_items_top(client, moderator_token):
    menu_items = MenuItem.query.filter_by(position=MenuItemPositionEnum.TOP).order_by(MenuItem.order_index).all()

    rv = client.get("/api/menu-items")
    assert rv.status_code == 200
    res = rv.json
    for r, menu_item in zip(filter(lambda r: r["position"] == MenuItemPositionEnum.TOP, res), menu_items):
        assert r["id"] == str(menu_item.id)
        assert r["orderIndex"] == menu_item.order_index

    new_order = {
        str(menu_items[0].id): 3,
        str(menu_items[1].id): 2,
        str(menu_items[2].id): 1,
        str(menu_items[3].id): 0,
    }
    rv = client.put("/api/menu-items/update-order-top", token=moderator_token, json=new_order)
    assert rv.status_code == 200

    rv = client.get("/api/menu-items")
    assert rv.status_code == 200
    res = rv.json
    for r, menu_item in zip(filter(lambda r: r["position"] == MenuItemPositionEnum.TOP, res), reversed(menu_items)):
        assert r["id"] == str(menu_item.id)
        assert r["orderIndex"] == 3 - menu_item.order_index


def test_successful_get_crag_menu_structure(client):
    rv = client.get("/api/menu-items/crag-menu-structure")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert res[0]["slug"] == "brione"
    assert res[0]["name"] == "Brione"
    assert res[1]["slug"] == "chironico"
    assert res[1]["name"] == "Chironico"

    assert res[0]["sectors"][0]["slug"] == "schattental"
    assert res[0]["sectors"][0]["name"] == "Schattental"
    assert res[0]["sectors"][1]["slug"] == "oben"
    assert res[0]["sectors"][1]["name"] == "Oben"

    assert res[0]["sectors"][0]["areas"][0]["slug"] == "dritter-block-von-links"
    assert res[0]["sectors"][0]["areas"][0]["name"] == "Dritter Block von links"
    assert res[0]["sectors"][0]["areas"][1]["slug"] == "noch-ein-bereich"
    assert res[0]["sectors"][0]["areas"][1]["name"] == "Noch ein Bereich"
