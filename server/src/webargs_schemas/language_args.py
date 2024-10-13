from webargs import fields

language_args = {"id": fields.Integer(required=True), "code": fields.Str(required=True)}
