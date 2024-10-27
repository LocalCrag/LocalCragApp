from models.area import Area
from models.enums.archive_type_enum import ArchiveTypeEnum
from models.line import Line
from models.sector import Sector
from models.topo_image import TopoImage


def test_archive_line(client, moderator_token):
    archive_data = {
        "type": ArchiveTypeEnum.LINE,
        "slug": "treppe",
        "value": True,
    }

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    line = Line.find_by_slug("treppe")
    assert line.archived

    archive_data["value"] = False

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    line = Line.find_by_slug("treppe")
    assert not line.archived


def test_archive_topo_image(client, moderator_token):
    area_id = Area.get_id_by_slug("dritter-block-von-links")
    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()

    archive_data = {
        "type": ArchiveTypeEnum.TOPO_IMAGE,
        "slug": str(topo_image.id),
        "value": True,
    }

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()
    assert topo_image.archived

    # Topo Image should not be included in default list
    rv = client.get("/api/areas/dritter-block-von-links/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert str(topo_image.id) not in [r["id"] for r in res]

    archive_data["value"] = False

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()
    assert not topo_image.archived


def test_archive_area(client, moderator_token):
    area_id = Area.get_id_by_slug("dritter-block-von-links")

    archive_data = {
        "type": ArchiveTypeEnum.AREA,
        "slug": "dritter-block-von-links",
        "value": True,
    }

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    assert Line.query.filter_by(area_id=area_id, archived=False).count() == 0
    assert Line.query.filter_by(area_id=area_id, archived=True).count() > 0

    assert TopoImage.query.filter_by(area_id=area_id, archived=False).count() == 0
    assert TopoImage.query.filter_by(area_id=area_id, archived=True).count() > 0

    archive_data["value"] = False

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert 400 <= rv.status_code < 500


def test_archive_sector(client, moderator_token):
    archive_data = {
        "type": ArchiveTypeEnum.SECTOR,
        "slug": "schattental",
        "value": True,
    }

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    assert Line.query.filter_by(sector_slug="schattental", archived=False).count() == 0
    assert Line.query.filter_by(sector_slug="schattental", archived=True).count() > 0

    assert TopoImage.query.join(Area).filter(Area.sector_slug == "schattental", not TopoImage.archived).count() == 0
    assert TopoImage.query.join(Area).filter(Area.sector_slug == "schattental", TopoImage.archived).count() > 0

    archive_data["value"] = False

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert 400 <= rv.status_code < 500


def test_archive_crag(client, moderator_token):
    archive_data = {
        "type": ArchiveTypeEnum.CRAG,
        "slug": "brione",
        "value": True,
    }

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert rv.status_code == 204

    assert Line.query.filter_by(crag_slug="brione", archived=False).count() == 0
    assert Line.query.filter_by(crag_slug="brione", archived=True).count() > 0

    assert (
        TopoImage.query.join(Area).join(Sector).filter(Sector.crag_slug == "brione", not TopoImage.archived).count()
        == 0
    )
    assert TopoImage.query.join(Area).join(Sector).filter(Sector.crag_slug == "brione", TopoImage.archived).count() > 0

    archive_data["value"] = False

    rv = client.post("/api/archive", token=moderator_token, json=archive_data)
    assert 400 <= rv.status_code < 500
