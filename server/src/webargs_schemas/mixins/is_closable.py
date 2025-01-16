from webargs import fields


class IsClosableWebargsMixin:
    """
    Mixin class that adds properties that are needed to mark a model as closed.
    """

    closed = fields.Boolean(required=True, allow_none=False)
    closedReason = fields.String(required=True, allow_none=True)
