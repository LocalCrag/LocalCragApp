from webargs import fields
from webargs.flaskparser import parser


@parser.location_loader("upload")
def load_upload(request, _schema):
    """
    Custom location to expose both form and files request parameters to webargs.
    """
    return {**request.form, **request.files}


upload_args = {
    "qqfile": fields.Field(required=True),
    "qqfilename": fields.String(required=True),
    "qquuid": fields.String(required=True),
    "qqtotalfilesize": fields.Integer(required=True),
}
