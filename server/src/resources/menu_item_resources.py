import time

from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.crag_schema import crags_schema, crags_menu_schema
from marshmallow_schemas.menu_item_schema import menu_items_schema, menu_item_schema
from marshmallow_schemas.menu_page_schema import menu_pages_schema, menu_page_schema
from models.area import Area
from models.crag import Crag
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.menu_item import MenuItem
from models.menu_page import MenuPage
from models.sector import Sector
from models.user import User
from util.auth import get_show_secret
from util.security_util import check_auth_claims
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
    @check_auth_claims(moderator=True)
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
        if new_menu_item.type == MenuItemTypeEnum.MENU_PAGE:
            new_menu_item.icon = menu_item_data['icon']
        new_menu_item.created_by_id = created_by.id
        new_menu_item.order_index = MenuItem.find_max_order_index_at_position(new_menu_item.position) + 1

        db.session.add(new_menu_item)
        db.session.commit()

        return menu_item_schema.dump(new_menu_item), 201


class UpdateMenuItem(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, menu_item_id):
        """
        Edit a menu item.
        @param menu_item_id: ID of the menu item to update.
        """
        menu_item_data = parser.parse(menu_item_args, request)
        menu_item: MenuItem = MenuItem.find_by_id(menu_item_id)

        if menu_item.position != menu_item_data['position']:
            menu_item.order_index = MenuItem.find_max_order_index_at_position(menu_item_data['position']) + 1
        if menu_item.type == MenuItemTypeEnum.MENU_PAGE:
            menu_item.icon = menu_item_data['icon']

        menu_item.type = menu_item_data['type']
        menu_item.position = menu_item_data['position']
        menu_item.menu_page_id = menu_item_data['menuPage']

        db.session.add(menu_item)
        db.session.commit()

        return menu_item_schema.dump(menu_item), 200


class DeleteMenuItem(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
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
    @check_auth_claims(moderator=True)
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
    @check_auth_claims(moderator=True)
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


class GetCragMenuStructure(MethodView):

    def get(self):

        # If the user is not at least a logged in member, we have to filter out secret spots
        filter_out_secret_spots_crag_clause = ''
        filter_out_secret_spots_sector_clause = ''
        filter_out_secret_spots_area_clause = ''
        if not get_show_secret():
            filter_out_secret_spots_crag_clause = 'WHERE crags.secret = FALSE'
            filter_out_secret_spots_sector_clause = 'AND sectors.secret = FALSE'
            filter_out_secret_spots_area_clause = 'AND areas.secret = FALSE'

        # We use custom SQL to optimize the query. This sped up the query by a factor of 10!
        res = db.session.execute(text('''
        SELECT crags.name, crags.slug, sectors.name, sectors.slug, areas.name, areas.slug 
        FROM crags
        LEFT OUTER JOIN sectors ON crags.id = sectors.crag_id {}
        LEFT OUTER JOIN areas ON sectors.id = areas.sector_id {}
        {}
        ORDER BY crags.order_index ASC, sectors.order_index ASC, areas.order_index ASC;
        '''.format(filter_out_secret_spots_sector_clause, filter_out_secret_spots_area_clause,
                   filter_out_secret_spots_crag_clause)))

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
            if row[3] and row[3] != sector_slug:
                sector_slug = row[3]
                sector_index += 1
                area_index = -1
            if row[5] and row[5] != area_slug:
                area_slug = row[5]
                area_index += 1
            if len(crags) < crag_index + 1:
                crags.append({
                    'name': row[0],
                    'slug': row[1],
                    'sectors': []
                })
                if not row[3]:
                    continue
            if len(crags[crag_index]['sectors']) < sector_index + 1:
                crags[crag_index]['sectors'].append({
                    'name': row[2],
                    'slug': row[3],
                    'areas': []
                })
                if not row[5]:
                    continue
            if len(crags[crag_index]['sectors'][sector_index]['areas']) < area_index + 1:
                crags[crag_index]['sectors'][sector_index]['areas'].append({
                    'name': row[4],
                    'slug': row[5],
                })
        return jsonify(crags), 200
