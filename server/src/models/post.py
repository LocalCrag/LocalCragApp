from extensions import db
from models.base_entity import BaseEntity
from models.mixins.has_slug import HasSlug


class Post(HasSlug, BaseEntity):
    """
    Model of a blog post.
    """

    __tablename__ = "posts"

    slug_target_columns = "title"
    title = db.Column(db.String(120), nullable=False)
    text = db.Column(db.Text, nullable=True)
