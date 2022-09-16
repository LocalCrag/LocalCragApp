from webargs import fields

from webargs_schemas.account_settings_args import user_account_settings_args
from webargs_schemas.permission_args import permission_args

user_args = {
    "firstname": fields.String(required=True),
    "lastname": fields.String(required=True),
    "email": fields.String(required=True),
    "permissions": fields.Nested(permission_args, required=True, many=True),
    "accountSettings": fields.Nested(user_account_settings_args, required=True)
}

user_id_args = {
    "id": fields.Integer(required=True)
}

user_contact_data_args = {
    "firstname": fields.String(required=True),
    "lastname": fields.String(required=True),
    "email": fields.String(required=True),
}

user_permissions_args = {
    "permissions": fields.Nested(permission_args, required=True, many=True)
}
