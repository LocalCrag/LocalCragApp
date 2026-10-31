from extensions import db
from models.area import Area
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.menu_item import MenuItem
from models.menu_page import MenuPage


def test_successful_create_menu_item(client, moderator_token):
    menu_page = MenuPage.find_by_slug("legal-notice")

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
    assert res[1]["menuPage"] is None
    assert res[1]["icon"] is None


def test_successful_get_menu_item(client):
    menu_item = MenuItem.query.filter_by(type=MenuItemTypeEnum.NEWS).first()

    rv = client.get(f"/api/menu-items/{menu_item.id}")
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == str(menu_item.id)
    assert res["type"] == "NEWS"
    assert res["position"] == "TOP"
    assert res["orderIndex"] == 0
    assert res["menuPage"] is None
    assert res["icon"] is None


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
    menu_page = MenuPage.find_by_slug("legal-notice")
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
    assert res["icon"] is None
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

    assert res[0]["sectors"][0]["slug"] == "pampelmousse"
    assert res[0]["sectors"][0]["name"] == "Pampelmousse"
    assert res[0]["sectors"][1]["slug"] == "upper-brione"
    assert res[0]["sectors"][1]["name"] == "Upper Brione"

    assert res[0]["sectors"][0]["areas"][0]["slug"] == "shark-attack"
    assert res[0]["sectors"][0]["areas"][0]["name"] == "Shark Attack"
    assert res[0]["sectors"][0]["areas"][1]["slug"] == "another-area"
    assert res[0]["sectors"][0]["areas"][1]["name"] == "Another Area"


def _url_payload(position="TOP", parent=None, title="Example"):
    return {
        "type": "URL",
        "position": position,
        "menuPage": None,
        "url": "https://example.com",
        "title": title,
        "icon": "pi-globe",
        "parent": parent,
    }


def test_create_nested_menu_item(client, moderator_token):
    parent = MenuItem.query.filter_by(type=MenuItemTypeEnum.NEWS).first()

    rv = client.post("/api/menu-items", token=moderator_token, json=_url_payload(parent=str(parent.id)))
    assert rv.status_code == 201
    res = rv.json
    assert res["parent"] == str(parent.id)
    assert res["position"] == "TOP"

    child_id = res["id"]
    grandchild = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_url_payload(parent=child_id, title="Nested example"),
    )
    assert grandchild.status_code == 201
    assert grandchild.json["parent"] == child_id


def test_topo_menu_item_cannot_be_a_parent(client, moderator_token):
    topo = MenuItem.query.filter_by(type=MenuItemTypeEnum.TOPO, position=MenuItemPositionEnum.TOP).first()

    nested = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_url_payload(parent=str(topo.id)),
    )
    assert nested.status_code == 400
    assert MenuItem.query.filter_by(parent_id=topo.id).count() == 0


def test_nested_menu_item_rejects_footer_self_cycle_and_unknown_parent(client, moderator_token):
    parent = MenuItem.query.filter_by(type=MenuItemTypeEnum.NEWS).first()

    footer = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_url_payload(position="BOTTOM", parent=str(parent.id)),
    )
    assert footer.status_code == 400

    self_parent = client.put(
        f"/api/menu-items/{parent.id}",
        token=moderator_token,
        json={
            "type": "NEWS",
            "position": "TOP",
            "menuPage": None,
            "icon": None,
            "title": None,
            "url": None,
            "parent": str(parent.id),
        },
    )
    assert self_parent.status_code == 400

    child = client.post("/api/menu-items", token=moderator_token, json=_url_payload(parent=str(parent.id)))
    assert child.status_code == 201
    cycle = client.put(
        f"/api/menu-items/{parent.id}",
        token=moderator_token,
        json={
            "type": "NEWS",
            "position": "TOP",
            "menuPage": None,
            "icon": None,
            "title": None,
            "url": None,
            "parent": child.json["id"],
        },
    )
    assert cycle.status_code == 400

    unknown = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_url_payload(parent="6b99766e-4597-492f-a8f1-450f1af7cfa2"),
    )
    assert unknown.status_code == 400


def test_leaving_header_or_deleting_parent_promotes_children(client, moderator_token):
    parent = MenuItem.query.filter_by(type=MenuItemTypeEnum.NEWS).first()
    child = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_url_payload(parent=str(parent.id)),
    )
    assert child.status_code == 201
    child_id = child.json["id"]

    moved = client.put(
        f"/api/menu-items/{parent.id}",
        token=moderator_token,
        json={
            "type": "NEWS",
            "position": "BOTTOM",
            "menuPage": None,
            "icon": None,
            "title": None,
            "url": None,
            "parent": None,
        },
    )
    assert moved.status_code == 200
    assert moved.json["parent"] is None
    assert moved.json["position"] == "BOTTOM"

    db.session.expire_all()
    assert MenuItem.find_by_id(child_id).parent_id is None

    parent.position = MenuItemPositionEnum.TOP
    parent.parent_id = None
    nested = MenuItem.find_by_id(child_id)
    nested.parent_id = parent.id
    nested.position = MenuItemPositionEnum.TOP
    db.session.add(parent)
    db.session.add(nested)
    db.session.commit()

    deleted = client.delete(f"/api/menu-items/{parent.id}", token=moderator_token)
    assert deleted.status_code == 204
    db.session.expire_all()
    assert MenuItem.find_by_id(child_id).parent_id is None


def _container_payload(position="TOP", parent=None, title="Areas"):
    return {
        "type": "CONTAINER",
        "position": position,
        "menuPage": None,
        "url": None,
        "title": title,
        "icon": "pi-folder",
        "parent": parent,
    }


def test_create_container_menu_item(client, moderator_token):
    rv = client.post("/api/menu-items", token=moderator_token, json=_container_payload())
    assert rv.status_code == 201
    res = rv.json
    assert res["type"] == "CONTAINER"
    assert res["position"] == "TOP"
    assert res["title"] == "Areas"
    assert res["icon"] == "pi-folder"
    assert res["url"] is None
    assert res["menuPage"] is None

    child = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_url_payload(parent=res["id"]),
    )
    assert child.status_code == 201
    assert child.json["parent"] == res["id"]


def test_container_rejects_footer_and_blank_title(client, moderator_token):
    footer = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_container_payload(position="BOTTOM"),
    )
    assert footer.status_code == 400

    blank = client.post(
        "/api/menu-items",
        token=moderator_token,
        json=_container_payload(title="  "),
    )
    assert blank.status_code == 400


def test_get_crag_menu_structure_excludes_closed_with_filter(client):
    area = Area.find_by_slug("shark-attack")
    area.closed = True
    db.session.add(area)
    db.session.commit()

    rv = client.get("/api/menu-items/crag-menu-structure")
    assert rv.status_code == 200
    all_areas = []
    for crag in rv.json:
        for sector in crag["sectors"]:
            all_areas.extend([a["slug"] for a in sector["areas"]])
    assert "shark-attack" in all_areas

    rv = client.get("/api/menu-items/crag-menu-structure?exclude_closed=1")
    assert rv.status_code == 200
    filtered_areas = []
    for crag in rv.json:
        for sector in crag["sectors"]:
            filtered_areas.extend([a["slug"] for a in sector["areas"]])
    assert "shark-attack" not in filtered_areas
