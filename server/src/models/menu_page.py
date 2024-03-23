from sqlalchemy import func

from extensions import db
from models.base_entity import BaseEntity
from sqlalchemy.dialects.postgresql import UUID

from models.mixins.has_slug import HasSlug


class MenuPage(HasSlug, BaseEntity):
    """
    Model of a menu page.
    """
    __tablename__ = 'menu_pages'

    slug_target_column = 'title'
    slug_blocklist = ['create-menu-page']
    title = db.Column(db.String(120), nullable=False)
    text = db.Column(db.Text, nullable=True)
