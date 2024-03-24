from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.menu_item_schema import menu_items_schema, menu_item_schema
from marshmallow_schemas.menu_page_schema import menu_pages_schema, menu_page_schema
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.menu_item import MenuItem
from models.menu_page import MenuPage
from models.user import User
from util.validators import validate_order_payload
from webargs_schemas.menu_item_args import menu_item_args
from webargs_schemas.menu_page_args import menu_page_args


class GetMenuItems(MethodView):

    def get(self):
        """
        Returns all menu items.
        """
        menu_items: MenuItem = MenuItem.return_all(order_by=lambda: MenuItem.order_index.asc())
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
    @jwt_required()
    def post(self):
        """
        Create a menu item.
        """
        menu_item_data = parser.parse(menu_item_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_menu_item: MenuItem = MenuItem()
        new_menu_item.type = menu_item_data['type']
        new_menu_item.position = menu_item_data['position']
        new_menu_item.menu_page_id = menu_item_data['menuPage']
        new_menu_item.created_by_id = created_by.id
        new_menu_item.order_index = MenuItem.find_max_order_index_at_position(new_menu_item.position) +1

        db.session.add(new_menu_item)
        db.session.commit()

        return menu_item_schema.dump(new_menu_item), 201


class UpdateMenuItem(MethodView):
    @jwt_required()
    def put(self, menu_item_id):
        """
        Edit a menu item.
        @param menu_item_id: ID of the menu item to update.
        """
        menu_item_data = parser.parse(menu_item_args, request)
        menu_item: MenuItem = MenuItem.find_by_id(menu_item_id)

        if menu_item.position != menu_item_data['position']:
            menu_item.order_index = MenuItem.find_max_order_index_at_position( menu_item_data['position']) +1

        menu_item.type = menu_item_data['type']
        menu_item.position = menu_item_data['position']
        menu_item.menu_page_id = menu_item_data['menuPage']

        db.session.add(menu_item)
        db.session.commit()

        return menu_page_schema.dump(menu_item), 200


class DeleteMenuItem(MethodView):
    @jwt_required()
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
    @jwt_required()
    def put(self):
        """
        Changes the order index of menu items with position TOP.
        """
        new_order = request.json
        menu_items = MenuItem.query.filter(MenuItem.position == MenuItemPositionEnum.TOP).all()

        if not validate_order_payload(new_order, menu_items):
            raise BadRequest('New order doesn\'t match the requirements of the data to order.')

        for menu_item in menu_items:
            menu_item.order_index = new_order[str(menu_item.id)]
            db.session.add(menu_item)

        db.session.commit()

        return jsonify(None), 200


class UpdateMenuItemBottomOrder(MethodView):
    @jwt_required()
    def put(self):
        """
        Changes the order index of menu items with position BOTTOM.
        """
        new_order = request.json
        menu_items = MenuItem.query.filter(MenuItem.position == MenuItemPositionEnum.BOTTOM).all()

        if not validate_order_payload(new_order, menu_items):
            raise BadRequest('New order doesn\'t match the requirements of the data to order.')

        for menu_item in menu_items:
            menu_item.order_index = new_order[str(menu_item.id)]
            db.session.add(menu_item)

        db.session.commit()

        return jsonify(None), 200

# todo tests for menu_items
