from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from webargs.flaskparser import parser

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from marshmallow_schemas.crag_schema import crag_schema, crags_schema
from marshmallow_schemas.post_schema import posts_schema, post_schema
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.post import Post
from models.region import Region
from models.sector import Sector
from models.user import User
from util.validators import validate_order_payload
from webargs_schemas.crag_args import crag_args
from webargs_schemas.post_args import post_args


class GetPosts(MethodView):

    def get(self):
        """
        Returns all posts.
        """
        posts: Post = Post.return_all(order_by=lambda: Post.time_created.desc())
        return jsonify(posts_schema.dump(posts)), 200


class GetPost(MethodView):
    def get(self, post_slug):
        """
        Returns a detailed post.
        @param post_slug: Slug of the post to return.
        """
        post: Post = Post.find_by_slug(slug=post_slug)
        return post_schema.dump(post), 200


class CreatePost(MethodView):
    @jwt_required()
    def post(self):
        """
        Create a post.
        """
        post_data = parser.parse(post_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_post: Post = Post()
        new_post.title = post_data['title']
        new_post.text = post_data['text']
        new_post.created_by_id = created_by.id

        db.session.add(new_post)
        db.session.commit()

        return post_schema.dump(new_post), 201


class UpdatePost(MethodView):
    @jwt_required()
    def put(self, post_slug):
        """
        Edit a post.
        @param post_slug: Slug of the post to update.
        """
        post_data = parser.parse(post_args, request)
        post: Post = Post.find_by_slug(post_slug)

        post.title = post_data['title']
        post.text = post_data['text']
        db.session.add(post)
        db.session.commit()

        return post_schema.dump(post), 200


class DeletePost(MethodView):
    @jwt_required()
    def delete(self, post_slug):
        """
        Delete a post.
        @param post_slug: Slug of the post to delete.
        """
        post: Post = Post.find_by_slug(post_slug)

        db.session.delete(post)
        db.session.commit()

        return jsonify(None), 204


# todo tests for posts