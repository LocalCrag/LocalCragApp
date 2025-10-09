from webargs import fields

from models.enums.archive_type_enum import ArchiveTypeEnum

archive_args = {
    "type": fields.Enum(required=True, enum=ArchiveTypeEnum),
    "slug": fields.Str(required=True),
    "value": fields.Boolean(required=True),
    "cascade": fields.Boolean(required=False, default=True),
}


def cross_validate_archive_args(args):
    if args["value"] is False and args["type"] in [
        ArchiveTypeEnum.AREA.value,
        ArchiveTypeEnum.SECTOR.value,
        ArchiveTypeEnum.CRAG.value,
    ]:
        return False
    return True
