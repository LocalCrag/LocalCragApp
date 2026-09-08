from extensions import db
from models.base_entity import BaseEntity


class AdminMessage(BaseEntity):
    """
    Admin-authored broadcast message shown as an inbox notification with a detail dialog.
    """

    __tablename__ = "admin_messages"

    title = db.Column(db.String(200), nullable=False)
    text = db.Column(db.Text(), nullable=False)
