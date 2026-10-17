from enum import StrEnum


class LandingPageEnum(StrEnum):
    """Pages the site can open on."""

    NEWS = "NEWS"
    TOPO = "TOPO"
    ASCENTS = "ASCENTS"
    RANKING = "RANKING"
    GALLERY = "GALLERY"
    HISTORY = "HISTORY"
    MENU_PAGE = "MENU_PAGE"
