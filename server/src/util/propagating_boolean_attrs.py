from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.tag import update_tag_secret_property


def set_line_parents_false(line: Line, attr: str):
    db.session.add(line)
    area = Area.find_by_id(line.area_id)
    setattr(area, attr, False)
    db.session.add(area)
    if attr == "secret":
        update_tag_secret_property(area)
    set_area_parents_false(area, attr)


def set_area_parents_false(area: Area, attr: str):
    db.session.add(area)
    sector = Sector.find_by_id(area.sector_id)
    setattr(sector, attr, False)
    db.session.add(sector)
    if attr == "secret":
        update_tag_secret_property(sector)
    set_sector_parents_false(sector, attr)


def set_sector_parents_false(sector: Sector, attr: str):
    db.session.add(sector)
    crag = Crag.find_by_id(sector.crag_id)
    setattr(crag, attr, False)
    db.session.add(crag)
    if attr == "secret":
        update_tag_secret_property(crag)


def update_line_propagating_boolean_attr(
    line: Line, value: bool, attr: str, is_recursive_call=False, set_additionally=None
):
    if getattr(line, attr) != value:
        if not is_recursive_call and not value:
            set_line_parents_false(line, attr)
        setattr(line, attr, value)
        db.session.add(line)
        if attr == "secret":
            update_tag_secret_property(line)
        if attr == "closed" and set_additionally:
            for key, value in set_additionally.items():
                setattr(line, key, value)


def update_area_propagating_boolean_attr(
    area: Area, value: bool, attr: str, is_recursive_call=False, set_additionally=None
):
    if getattr(area, attr) != value:
        if not is_recursive_call and not value:
            set_area_parents_false(area, attr)
        setattr(area, attr, value)
        db.session.add(area)
        if attr == "secret":
            update_tag_secret_property(area)
        lines = area.lines
        for line in lines:
            update_line_propagating_boolean_attr(line, value, attr, True, set_additionally=set_additionally)
        if attr == "closed" and set_additionally:
            for key, value in set_additionally.items():
                setattr(area, key, value)


def update_sector_propagating_boolean_attr(
    sector: Sector, value: bool, attr: str, is_recursive_call=False, set_additionally=None
):
    if getattr(sector, attr) != value:
        if not is_recursive_call and not value:
            set_sector_parents_false(sector, attr)
        setattr(sector, attr, value)
        db.session.add(sector)
        if attr == "secret":
            update_tag_secret_property(sector)
        areas = sector.areas
        for area in areas:
            update_area_propagating_boolean_attr(area, value, attr, True, set_additionally=set_additionally)
        if attr == "closed" and set_additionally:
            for key, value in set_additionally.items():
                setattr(sector, key, value)


def update_crag_propagating_boolean_attr(
    crag: Crag, value: bool, attr: str, is_recursive_call=False, set_additionally=None
):
    if getattr(crag, attr) != value:
        setattr(crag, attr, value)
        db.session.add(crag)
        if attr == "secret":
            update_tag_secret_property(crag)
        sectors = crag.sectors
        for sector in sectors:
            update_sector_propagating_boolean_attr(sector, value, attr, True, set_additionally=set_additionally)
        if attr == "closed" and set_additionally:
            for key, value in set_additionally.items():
                setattr(crag, key, value)
