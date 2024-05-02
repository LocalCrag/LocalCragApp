from extensions import db
from models.area import Area
from models.crag import Crag
from models.sector import Sector


def update_area_secret_property(area: Area, secret: bool):
    if area.secret != secret:
        area.secret = secret
        db.session.add(area)
        lines = area.lines
        for line in lines:
            line.secret = secret
            db.session.add(line)


def update_sector_secret_property(sector: Sector, secret: bool):
    if sector.secret != secret:
        sector.secret = secret
        db.session.add(sector)
        areas = sector.areas
        for area in areas:
            update_area_secret_property(area, secret)


def update_crag_secret_property(crag: Crag, secret: bool):
    if crag.secret != secret:
        crag.secret = secret
        db.session.add(crag)
        sectors = crag.sectors
        for sector in sectors:
            update_sector_secret_property(sector, secret)
