from models.area import Area
from models.line import Line
from models.sector import Sector
from models.topo_image import TopoImage


def test_archive_line(client, moderator_token):
    rv = client.get("/api/lines/treppe")
    assert rv.status_code == 200
    line_data = rv.json

    line_data["archived"] = True
    del line_data["id"]
    del line_data["areaSlug"]
    del line_data["sectorSlug"]
    del line_data["cragSlug"]
    del line_data["ascentCount"]
    del line_data["linePaths"]
    del line_data["slug"]

    rv = client.put("/api/lines/treppe", token=moderator_token, json=line_data)
    assert rv.status_code == 200

    line = Line.find_by_slug("treppe")
    assert line.archived

    rv = client.get("/api/lines")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert str(line.id) not in [r["id"] for r in res]


def test_archive_topo_image(client, moderator_token):
    area_id = Area.get_id_by_slug("dritter-block-von-links")
    topo_image = TopoImage.query.filter_by(area_id=area_id, order_index=0).first()

    rv = client.get(f"/api/topo-images/{topo_image.id}")
    assert rv.status_code == 200
    topo_image_data = rv.json

    topo_image_data["archived"] = True
    topo_image_data["image"] = topo_image_data["image"]["id"]
    del topo_image_data["id"]
    del topo_image_data["linePaths"]
    del topo_image_data["orderIndex"]

    rv = client.put(f"/api/topo-images/{topo_image.id}", token=moderator_token, json=topo_image_data)
    assert rv.status_code == 200, (print(rv.json), topo_image_data["image"])

    topo_image = TopoImage.query.filter_by(order_index=0).first()
    assert topo_image.archived

    rv = client.get("/api/areas/dritter-block-von-links/topo-images")
    assert rv.status_code == 200
    res = rv.json
    assert str(topo_image.id) not in [r["id"] for r in res]


def test_archive_area(client, moderator_token):
    area_id = Area.get_id_by_slug("dritter-block-von-links")
    rv = client.get("/api/areas/dritter-block-von-links")
    assert rv.status_code == 200
    area_data = rv.json

    area_data["archived"] = True
    area_data["mapMarkers"] = []
    del area_data["id"]
    del area_data["ascentCount"]
    del area_data["orderIndex"]
    del area_data["slug"]

    rv = client.put("/api/areas/dritter-block-von-links", token=moderator_token, json=area_data)
    assert rv.status_code == 200

    assert Line.query.filter_by(area_id=area_id, archived=False).count() == 0
    assert Line.query.filter_by(area_id=area_id, archived=True).count() > 0

    assert TopoImage.query.filter_by(area_id=area_id, archived=False).count() == 0
    assert TopoImage.query.filter_by(area_id=area_id, archived=True).count() > 0


def test_archive_sector(client, moderator_token):
    rv = client.get("/api/sectors/schattental")
    assert rv.status_code == 200
    sector_data = rv.json

    sector_data["archived"] = True
    del sector_data["id"]
    del sector_data["ascentCount"]
    del sector_data["orderIndex"]
    del sector_data["slug"]

    rv = client.put("/api/sectors/schattental", token=moderator_token, json=sector_data)
    assert rv.status_code == 200

    assert Line.query.filter_by(sector_slug="schattental", archived=False).count() == 0
    assert Line.query.filter_by(sector_slug="schattental", archived=True).count() > 0

    assert (
        TopoImage.query.join(Area).filter(Area.sector_slug == "schattental", not TopoImage.archived).count() == 0
    )
    assert TopoImage.query.join(Area).filter(Area.sector_slug == "schattental", TopoImage.archived).count() > 0


def test_archive_crag(client, moderator_token):
    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    crag_data = rv.json

    crag_data["archived"] = True
    del crag_data["id"]
    del crag_data["ascentCount"]
    del crag_data["orderIndex"]
    del crag_data["slug"]

    rv = client.put("/api/crags/brione", token=moderator_token, json=crag_data)
    assert rv.status_code == 200

    assert Line.query.filter_by(crag_slug="brione", archived=False).count() == 0
    assert Line.query.filter_by(crag_slug="brione", archived=True).count() > 0

    assert (
        TopoImage.query.join(Area)
        .join(Sector)
        .filter(Sector.crag_slug == "brione", not TopoImage.archived)
        .count()
        == 0
    )
    assert (
        TopoImage.query.join(Area).join(Sector).filter(Sector.crag_slug == "brione", TopoImage.archived).count()
        > 0
    )
