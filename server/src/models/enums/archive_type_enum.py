from enum import StrEnum


class ArchiveTypeEnum(StrEnum):
    """
    All possible types of lines.
    """

    LINE = "LINE"
    TOPO_IMAGE = "TOPO_IMAGE"
    AREA = "AREA"
    SECTOR = "SECTOR"
    CRAG = "CRAG"
