from extensions import db
from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.topo_image import TopoImage


def set_topo_image_archived(topo_image: TopoImage):
    lines = Line.query.join(Line.line_paths).filter_by(topo_image_id=topo_image.id).all()
    for line in lines:
        line.archived = not line.archived
        db.session.add(line)


def set_area_archived(area: Area):
    lines = Line.query.filter_by(area_id=area.id, archived=False).all()
    for line in lines:
        line.archived = True
    db.session.add_all(lines)

    topo_images = TopoImage.query.filter_by(area_id=area.id, archived=False).all()
    for topo_image in topo_images:
        topo_image.archived = True
    db.session.add_all(topo_images)


def set_crag_archived(crag: Crag):
    sectors = Sector.query.filter_by(crag_id=crag.id).all()
    for sector in sectors:
        set_sector_archived(sector)


def set_sector_archived(sector: Sector):
    areas = Area.query.filter_by(sector_id=sector.id).all()
    for area in areas:
        set_area_archived(area)
