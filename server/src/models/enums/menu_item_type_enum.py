from enum import Enum


class MenuItemTypeEnum(Enum):
    """
    All possible types of menu items.
    """

    MENU_PAGE = "MENU_PAGE"
    TOPO = "TOPO"
    ASCENTS = "ASCENTS"
    RANKING = "RANKING"
    NEWS = "NEWS"
    GALLERY = "GALLERY"
    HISTORY = "HISTORY"
    URL = "URL"
