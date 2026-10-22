from webargs import fields

from models.enums.archive_type_enum import ArchiveTypeEnum

archive_args = {
    "type": fields.Enum(required=True, enum=ArchiveTypeEnum),
    "slug": fields.Str(required=True),
    "value": fields.Boolean(required=True),
    "cascade": fields.Boolean(required=False),
}
