from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import text
from sqlalchemy.orm import joinedload
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.menu_item_schema import menu_item_schema, menu_items_schema
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.menu_item import MenuItem
from util.auth_session import (
    session_required,
)
from util.secret_service import SecretService
from util.validators import validate_order_payload
from webargs_schemas.menu_item_args import menu_item_args


class GetMenuItems(MethodView):

    def get(self):
        """
        Returns all menu items.
        """
        menu_items: MenuItem = MenuItem.return_all(
            order_by=lambda: MenuItem.order_index.asc(),
            options=joinedload(MenuItem.menu_page),
        )
        return jsonify(menu_items_schema.dump(menu_items)), 200


class GetMenuItem(MethodView):
    def get(self, menu_item_id):
        """
        Returns a detailed menu item.
        @param menu_item_id: ID of the menu item to return.
        """
        menu_item: MenuItem = MenuItem.find_by_id(menu_item_id)
        return menu_item_schema.dump(menu_item), 200


class CreateMenuItem(MethodView):
    @session_required(moderator=True)
    def post(self):
        """
        Create a menu item.
        """
        menu_item_data = parser.parse(menu_item_args, request)

        new_menu_item: MenuItem = MenuItem()
        new_menu_item.type = menu_item_data["type"]
        new_menu_item.position = menu_item_data["position"]
        _apply_type_fields(new_menu_item, menu_item_data)
        _apply_parent(new_menu_item, menu_item_data.get("parent"), new_menu_item.position)
        new_menu_item.order_index = MenuItem.find_max_order_index_at_position(new_menu_item.position) + 1

        db.session.add(new_menu_item)
        db.session.commit()

        return menu_item_schema.dump(new_menu_item), 201


class UpdateMenuItem(MethodView):
    @session_required(moderator=True)
    def put(self, menu_item_id):
        """
        Edit a menu item.
        @param menu_item_id: ID of the menu item to update.
        """
        menu_item_data = parser.parse(menu_item_args, request)
        menu_item: MenuItem = MenuItem.find_by_id(menu_item_id)

        if menu_item.position != menu_item_data["position"]:
            menu_item.order_index = MenuItem.find_max_order_index_at_position(menu_item_data["position"]) + 1

        menu_item.type = menu_item_data["type"]
        menu_item.position = menu_item_data["position"]
        _apply_type_fields(menu_item, menu_item_data)
        _apply_parent(menu_item, menu_item_data.get("parent"), menu_item.position)

        db.session.add(menu_item)
        db.session.commit()

        return menu_item_schema.dump(menu_item), 200


class DeleteMenuItem(MethodView):
    @session_required(moderator=True)
    def delete(self, menu_item_id):
        """
        Delete a menu item.
        @param menu_item_id: ID of the menu item to delete.
        """
        menu_item: MenuItem = MenuItem.find_by_id(menu_item_id)

        db.session.delete(menu_item)
        db.session.commit()

        return jsonify(None), 204


class UpdateMenuItemTopOrder(MethodView):
    @session_required(moderator=True)
    def put(self):
        """
        Changes the order index of menu items with position TOP.
        """
        new_order = request.json
        menu_items = MenuItem.query.filter(MenuItem.position == MenuItemPositionEnum.TOP).all()

        if not validate_order_payload(new_order, menu_items):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for menu_item in menu_items:
            menu_item.order_index = new_order[str(menu_item.id)]
            db.session.add(menu_item)

        db.session.commit()

        return jsonify(None), 200


class UpdateMenuItemBottomOrder(MethodView):
    @session_required(moderator=True)
    def put(self):
        """
        Changes the order index of menu items with position BOTTOM.
        """
        new_order = request.json
        menu_items = MenuItem.query.filter(MenuItem.position == MenuItemPositionEnum.BOTTOM).all()

        if not validate_order_payload(new_order, menu_items):
            raise BadRequest("New order doesn't match the requirements of the data to order.")

        for menu_item in menu_items:
            menu_item.order_index = new_order[str(menu_item.id)]
            db.session.add(menu_item)

        db.session.commit()

        return jsonify(None), 200


class GetCragMenuStructure(MethodView):

    def get(self):
        exclude_closed = request.args.get("exclude_closed", False, type=bool)

        # If the user is not at least a logged in member, we have to filter out secret spots
        filter_out_secret_spots_crag_clause = ""
        filter_out_secret_spots_sector_clause = ""
        filter_out_secret_spots_area_clause = ""
        if not SecretService.can_view_secrets():
            filter_out_secret_spots_crag_clause = "WHERE crags.id NOT IN (SELECT entity_id FROM secret_topo_entities)"
            filter_out_secret_spots_sector_clause = "AND sectors.id NOT IN (SELECT entity_id FROM secret_topo_entities)"
            filter_out_secret_spots_area_clause = "AND areas.id NOT IN (SELECT entity_id FROM secret_topo_entities)"

        filter_out_closed_spots_crag_clause = ""
        filter_out_closed_spots_sector_clause = ""
        filter_out_closed_spots_area_clause = ""
        if exclude_closed:
            filter_out_closed_spots_crag_clause = (
                "AND crags.closed = FALSE" if filter_out_secret_spots_crag_clause else "WHERE crags.closed = FALSE"
            )
            filter_out_closed_spots_sector_clause = "AND sectors.closed = FALSE"
            filter_out_closed_spots_area_clause = "AND areas.closed = FALSE"

        # We use custom SQL to optimize the query. This sped up the query by a factor of 10!
        res = db.session.execute(
            text(
                """
        SELECT crags.name, crags.slug, crags.id, sectors.name, sectors.slug,
        sectors.id, areas.name, areas.slug , areas.id
        FROM crags
        LEFT OUTER JOIN sectors ON crags.id = sectors.crag_id {} {}
        LEFT OUTER JOIN areas ON sectors.id = areas.sector_id {} {}
        {} {}
        ORDER BY crags.order_index ASC, sectors.order_index ASC, areas.order_index ASC;
        """.format(
                    filter_out_secret_spots_sector_clause,
                    filter_out_closed_spots_sector_clause,
                    filter_out_secret_spots_area_clause,
                    filter_out_closed_spots_area_clause,
                    filter_out_secret_spots_crag_clause,
                    filter_out_closed_spots_crag_clause,
                )
            )
        )

        # This means we also need custom result row parsing...
        crags = []
        crag_index = -1
        sector_index = -1
        area_index = -1
        crag_slug = None
        sector_slug = None
        area_slug = None
        for row in res:
            if row[1] != crag_slug:
                crag_slug = row[1]
                crag_index += 1
                sector_index = -1
                area_index = -1
            if row[4] and row[4] != sector_slug:
                sector_slug = row[4]
                sector_index += 1
                area_index = -1
            if row[7] and row[7] != area_slug:
                area_slug = row[7]
                area_index += 1
            if len(crags) < crag_index + 1:
                crags.append({"name": row[0], "slug": row[1], "id": row[2], "sectors": []})
                if not row[3]:
                    continue
            if len(crags[crag_index]["sectors"]) < sector_index + 1:
                crags[crag_index]["sectors"].append({"name": row[3], "slug": row[4], "id": row[5], "areas": []})
                if not row[7]:
                    continue
            if len(crags[crag_index]["sectors"][sector_index]["areas"]) < area_index + 1:
                crags[crag_index]["sectors"][sector_index]["areas"].append(
                    {
                        "name": row[6],
                        "slug": row[7],
                        "id": row[8],
                    }
                )
        return jsonify(crags), 200


def _apply_type_fields(menu_item: MenuItem, data):
    """
    Copies the fields that belong to this type and clears the rest.
    A container is a header label for nested items. It has no page and no link.
    """
    menu_item.icon = None
    menu_item.url = None
    menu_item.title = None
    menu_item.menu_page_id = None

    if data["type"] == MenuItemTypeEnum.CONTAINER:
        title = (data.get("title") or "").strip()
        if not title:
            raise BadRequest("A container menu item needs a title.")
        if data["position"] != MenuItemPositionEnum.TOP:
            raise BadRequest("Container menu items can only be used in the header.")
        menu_item.title = title
        menu_item.icon = data["icon"]
        return

    if data["type"] == MenuItemTypeEnum.MENU_PAGE:
        menu_item.icon = data["icon"]
        menu_item.menu_page_id = data["menuPage"]
    elif data["type"] == MenuItemTypeEnum.URL:
        menu_item.url = data["url"]
        menu_item.icon = data["icon"]
        menu_item.title = data["title"]


def _apply_parent(menu_item: MenuItem, parent_id, position):
    """
    Header items can nest under other header items. Footer items stay flat.
    Leaving the header promotes this item's children back to the top level.
    """
    if position != MenuItemPositionEnum.TOP:
        if parent_id is not None:
            raise BadRequest("Only header menu items can be nested.")
        menu_item.parent_id = None
        if menu_item.id is not None:
            _promote_children(menu_item.id)
        return

    if parent_id is None:
        menu_item.parent_id = None
        return

    if menu_item.id is not None and parent_id == menu_item.id:
        raise BadRequest("A menu item cannot be nested under itself.")

    parent = MenuItem.query.filter_by(id=parent_id).first()
    if parent is None:
        raise BadRequest("Parent menu item not found.")
    if parent.position != MenuItemPositionEnum.TOP:
        raise BadRequest("Menu items can only be nested under header items.")
    if parent.type == MenuItemTypeEnum.TOPO:
        raise BadRequest("Topo menu items cannot have nested children.")
    if menu_item.id is not None and _parent_chain_contains(parent, menu_item.id):
        raise BadRequest("Menu items cannot be nested in a cycle.")

    menu_item.parent_id = parent_id


def _parent_chain_contains(parent: MenuItem, item_id) -> bool:
    seen = set()
    current = parent
    while current is not None:
        if current.id == item_id:
            return True
        if current.id in seen:
            return False
        seen.add(current.id)
        if current.parent_id is None:
            return False
        current = MenuItem.query.filter_by(id=current.parent_id).first()
    return False


def _promote_children(menu_item_id):
    children = MenuItem.query.filter_by(parent_id=menu_item_id).all()
    for child in children:
        child.parent_id = None
        db.session.add(child)
