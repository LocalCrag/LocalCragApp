from extensions import db


class HasOrderIndex:
    """
    Mixin class that adds an order_index column to a model.
    """

    order_index = db.Column(db.Integer, nullable=False, server_default="0")
