from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.menu_page_schema import menu_pages_schema, menu_page_schema
from models.menu_page import MenuPage
from models.user import User
from util.bucket_placeholders import add_bucket_placeholders
from util.security_util import check_auth_claims
from webargs_schemas.menu_page_args import menu_page_args


class GetMenuPages(MethodView):

    def get(self):
        """
        Returns all menu pages.
        """
        menu_pages: MenuPage = MenuPage.return_all(order_by=lambda: MenuPage.time_created.desc())
        return jsonify(menu_pages_schema.dump(menu_pages)), 200


class GetMenuPage(MethodView):
    def get(self, menu_page_slug):
        """
        Returns a detailed menu page.
        @param menu_page_slug: Slug of the menu page to return.
        """
        menu_page: MenuPage = MenuPage.find_by_slug(slug=menu_page_slug)
        return menu_page_schema.dump(menu_page), 200


class CreateMenuPage(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def post(self):
        """
        Create a menu page.
        """
        menu_page_data = parser.parse(menu_page_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_menu_page: MenuPage = MenuPage()
        new_menu_page.title = menu_page_data['title'].strip()
        new_menu_page.text = add_bucket_placeholders(menu_page_data['text'])
        new_menu_page.created_by_id = created_by.id

        db.session.add(new_menu_page)
        db.session.commit()

        return menu_page_schema.dump(new_menu_page), 201


class UpdateMenuPage(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, menu_page_slug):
        """
        Edit a menu page.
        @param menu_page_slug: Slug of the menu page to update.
        """
        menu_page_data = parser.parse(menu_page_args, request)
        menu_page: MenuPage = MenuPage.find_by_slug(menu_page_slug)

        menu_page.title = menu_page_data['title'].strip()
        menu_page.text = add_bucket_placeholders(menu_page_data['text'])
        db.session.add(menu_page)
        db.session.commit()

        return menu_page_schema.dump(menu_page), 200


class DeleteMenuPage(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, menu_page_slug):
        """
        Delete a menu_page.
        @param menu_page_slug: Slug of the menu_page to delete.
        """
        menu_page: MenuPage = MenuPage.find_by_slug(menu_page_slug)

        db.session.delete(menu_page)
        db.session.commit()

        return jsonify(None), 204
