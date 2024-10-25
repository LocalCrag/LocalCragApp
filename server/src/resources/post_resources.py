from flask import jsonify, request
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required
from webargs.flaskparser import parser

from extensions import db
from marshmallow_schemas.post_schema import post_schema, posts_schema
from models.post import Post
from models.user import User
from util.bucket_placeholders import add_bucket_placeholders
from util.security_util import check_auth_claims
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
    @check_auth_claims(moderator=True)
    def post(self):
        """
        Create a post.
        """
        post_data = parser.parse(post_args, request)
        created_by = User.find_by_email(get_jwt_identity())

        new_post: Post = Post()
        new_post.title = post_data["title"].strip()
        new_post.text = add_bucket_placeholders(post_data["text"])
        new_post.created_by_id = created_by.id

        db.session.add(new_post)
        db.session.commit()

        return post_schema.dump(new_post), 201


class UpdatePost(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def put(self, post_slug):
        """
        Edit a post.
        @param post_slug: Slug of the post to update.
        """
        post_data = parser.parse(post_args, request)
        post: Post = Post.find_by_slug(post_slug)

        post.title = post_data["title"].strip()
        post.text = add_bucket_placeholders(post_data["text"])
        db.session.add(post)
        db.session.commit()

        return post_schema.dump(post), 200


class DeletePost(MethodView):
    @jwt_required()
    @check_auth_claims(moderator=True)
    def delete(self, post_slug):
        """
        Delete a post.
        @param post_slug: Slug of the post to delete.
        """
        post: Post = Post.find_by_slug(post_slug)

        db.session.delete(post)
        db.session.commit()

        return jsonify(None), 204
