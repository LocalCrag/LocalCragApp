from webargs import fields

from error_handling.http_exceptions.bad_request import BadRequest
from messages.messages import ResponseMessage
from models.enums.user_promotion_enum import UserPromotionEnum

user_args = {
    "firstname": fields.String(required=True),
    "lastname": fields.String(required=True),
    "email": fields.String(required=True),
    "avatar": fields.String(required=True, allow_none=True)
}

user_registration_args = {
    "firstname": fields.String(required=True),
    "lastname": fields.String(required=True),
    "email": fields.String(required=True),
}


user_promotion_args = {
    "promotionTarget": fields.Enum(UserPromotionEnum, required=True, allow_none=False),
}
