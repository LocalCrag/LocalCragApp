from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector


def set_line_parents_unsecret(line: Line):
    area = Area.find_by_id(line.area_id)
    area.secret = False
    db.session.add(area)
    set_area_parents_unsecret(area)


def set_area_parents_unsecret(area: Area):
    sector = Sector.find_by_id(area.sector_id)
    sector.secret = False
    db.session.add(sector)
    set_sector_parents_unsecret(sector)


def set_sector_parents_unsecret(sector: Sector):
    crag = Crag.find_by_id(sector.crag_id)
    crag.secret = False
    db.session.add(crag)


def update_line_secret_property(line: Line, secret: bool, is_recursive_call=False):
    if line.secret != secret:
        if not is_recursive_call and not secret:
            set_line_parents_unsecret(line)
        line.secret = secret
        db.session.add(line)


def update_area_secret_property(area: Area, secret: bool, is_recursive_call=False):
    if area.secret != secret:
        if not is_recursive_call and not secret:
            set_area_parents_unsecret(area)
        area.secret = secret
        db.session.add(area)
        lines = area.lines
        for line in lines:
            update_line_secret_property(line, secret, True)


def update_sector_secret_property(sector: Sector, secret: bool, is_recursive_call=False):
    if sector.secret != secret:
        if not is_recursive_call and not secret:
            set_sector_parents_unsecret(sector)
        sector.secret = secret
        db.session.add(sector)
        areas = sector.areas
        for area in areas:
            update_area_secret_property(area, secret, True)


def update_crag_secret_property(crag: Crag, secret: bool, is_recursive_call=False):
    if crag.secret != secret:
        crag.secret = secret
        db.session.add(crag)
        sectors = crag.sectors
        for sector in sectors:
            update_sector_secret_property(sector, secret, True)
