from marshmallow import validate
from webargs import fields

from models.enums.user_promotion_enum import UserPromotionEnum

user_args = {
    "firstname": fields.String(required=True, validate=validate.Length(max=120)),
    "lastname": fields.String(required=True, validate=validate.Length(max=120)),
    "email": fields.String(required=True, validate=validate.Length(max=120)),
    "avatar": fields.String(required=True, allow_none=True)
}

user_registration_args = {
    "firstname": fields.String(required=True, validate=validate.Length(max=120)),
    "lastname": fields.String(required=True, validate=validate.Length(max=120)),
    "email": fields.String(required=True, validate=validate.Length(max=120)),
}


user_promotion_args = {
    "promotionTarget": fields.Enum(UserPromotionEnum, required=True, allow_none=False),
}
