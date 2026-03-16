from extensions import db
from models.area import Area
from models.crag import Crag
from models.sector import Sector


def test_nearest_blocweather_url_for_area_prefers_area(client):
    area: Area = Area.find_by_slug("dritter-block-von-links")
    sector: Sector = area.sector
    crag: Crag = sector.crag

    area.blocweather_url = "https://blocweather.com/france/fontainebleau/bas-cuvier"
    sector.blocweather_url = "https://blocweather.com/switzerland/ticino/brione"
    crag.blocweather_url = "https://blocweather.com/austria/tirol/zillertal"
    db.session.add_all([area, sector, crag])
    db.session.commit()

    rv = client.get(f"/api/blocweather/nearest/area/{area.slug}")
    assert rv.status_code == 200
    assert rv.json["blocweatherUrl"] == "https://blocweather.com/france/fontainebleau/bas-cuvier"


def test_nearest_blocweather_url_for_area_falls_back_to_sector(client):
    area: Area = Area.find_by_slug("dritter-block-von-links")
    sector: Sector = area.sector
    crag: Crag = sector.crag

    area.blocweather_url = None
    sector.blocweather_url = "https://blocweather.com/switzerland/ticino/brione"
    crag.blocweather_url = "https://blocweather.com/austria/tirol/zillertal"
    db.session.add_all([area, sector, crag])
    db.session.commit()

    rv = client.get(f"/api/blocweather/nearest/area/{area.slug}")
    assert rv.status_code == 200
    assert rv.json["blocweatherUrl"] == "https://blocweather.com/switzerland/ticino/brione"


def test_nearest_blocweather_url_for_area_falls_back_to_crag(client):
    area: Area = Area.find_by_slug("dritter-block-von-links")
    sector: Sector = area.sector
    crag: Crag = sector.crag

    area.blocweather_url = None
    sector.blocweather_url = None
    crag.blocweather_url = "https://blocweather.com/austria/tirol/zillertal"
    db.session.add_all([area, sector, crag])
    db.session.commit()

    rv = client.get(f"/api/blocweather/nearest/area/{area.slug}")
    assert rv.status_code == 200
    assert rv.json["blocweatherUrl"] == "https://blocweather.com/austria/tirol/zillertal"


def test_nearest_blocweather_url_for_sector_prefers_sector(client):
    sector: Sector = Sector.find_by_slug("schattental")
    crag: Crag = sector.crag

    sector.blocweather_url = "https://blocweather.com/switzerland/ticino/brione"
    crag.blocweather_url = "https://blocweather.com/austria/tirol/zillertal"
    db.session.add_all([sector, crag])
    db.session.commit()

    rv = client.get(f"/api/blocweather/nearest/sector/{sector.slug}")
    assert rv.status_code == 200
    assert rv.json["blocweatherUrl"] == "https://blocweather.com/switzerland/ticino/brione"


def test_nearest_blocweather_url_for_sector_falls_back_to_crag(client):
    sector: Sector = Sector.find_by_slug("schattental")
    crag: Crag = sector.crag

    sector.blocweather_url = None
    crag.blocweather_url = "https://blocweather.com/austria/tirol/zillertal"
    db.session.add_all([sector, crag])
    db.session.commit()

    rv = client.get(f"/api/blocweather/nearest/sector/{sector.slug}")
    assert rv.status_code == 200
    assert rv.json["blocweatherUrl"] == "https://blocweather.com/austria/tirol/zillertal"


def test_nearest_blocweather_url_for_crag_returns_own(client):
    crag: Crag = Crag.find_by_slug("brione")

    crag.blocweather_url = "https://blocweather.com/france/fontainebleau/bas-cuvier"
    db.session.add(crag)
    db.session.commit()

    rv = client.get(f"/api/blocweather/nearest/crag/{crag.slug}")
    assert rv.status_code == 200
    assert rv.json["blocweatherUrl"] == "https://blocweather.com/france/fontainebleau/bas-cuvier"


def test_nearest_blocweather_url_invalid_level_returns_404(client):
    rv = client.get("/api/blocweather/nearest/nope/brione")
    assert rv.status_code == 400
