"""Tests for batch count prefetch used by list endpoints."""

from models.area import Area
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from util.entity_count_cache import (
    get_cached_ascent_count,
    get_cached_line_ascent_count,
    get_cached_line_count,
)
from util.secret_service import SecretService
from util.topo_entity_counts import (
    attach_area_counts,
    attach_crag_counts,
    attach_line_ascent_counts,
    attach_sector_counts,
)


def _secret_line_payload():
    return {
        "name": "Batch Count Secret Line",
        "description": "test",
        "videos": [],
        "authorGradeValue": 1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": None,
        "faYear": None,
        "faDate": None,
        "faName": None,
        "startingPosition": "FRENCH",
        "eliminate": False,
        "traverse": False,
        "highball": False,
        "morpho": False,
        "lowball": False,
        "noTopout": False,
        "badDropzone": False,
        "childFriendly": False,
        "roof": False,
        "slab": False,
        "vertical": False,
        "overhang": False,
        "athletic": False,
        "technical": False,
        "endurance": False,
        "cruxy": False,
        "dyno": False,
        "jugs": False,
        "sloper": False,
        "crimps": False,
        "pockets": False,
        "pinches": False,
        "crack": False,
        "dihedral": False,
        "compression": False,
        "arete": False,
        "mantle": False,
        "secret": True,
        "closureSchedules": [],
    }


def test_attach_crag_counts_matches_uncached_hybrid_properties():
    crags = Crag.query.order_by(Crag.order_index).all()
    expected_line_counts = {crag.id: crag.line_count for crag in crags}
    expected_ascent_counts = {crag.id: crag.ascent_count for crag in crags}

    attach_crag_counts(crags)

    for crag in crags:
        assert get_cached_line_count(crag) == expected_line_counts[crag.id]
        assert get_cached_ascent_count(crag) == expected_ascent_counts[crag.id]
        assert crag.line_count == expected_line_counts[crag.id]
        assert crag.ascent_count == expected_ascent_counts[crag.id]


def test_attach_sector_counts_matches_uncached_hybrid_properties():
    crag = Crag.find_by_slug("brione")
    sectors = Sector.query.filter_by(crag_id=crag.id).order_by(Sector.order_index).all()
    expected_line_counts = {sector.id: sector.line_count for sector in sectors}
    expected_ascent_counts = {sector.id: sector.ascent_count for sector in sectors}

    attach_sector_counts(sectors)

    for sector in sectors:
        assert get_cached_line_count(sector) == expected_line_counts[sector.id]
        assert get_cached_ascent_count(sector) == expected_ascent_counts[sector.id]
        assert sector.line_count == expected_line_counts[sector.id]
        assert sector.ascent_count == expected_ascent_counts[sector.id]


def test_attach_area_counts_matches_uncached_hybrid_properties():
    sector = Sector.find_by_slug("pampelmousse")
    areas = Area.query.filter_by(sector_id=sector.id).order_by(Area.order_index).all()
    expected_line_counts = {area.id: area.line_count for area in areas}
    expected_ascent_counts = {area.id: area.ascent_count for area in areas}

    attach_area_counts(areas)

    for area in areas:
        assert get_cached_line_count(area) == expected_line_counts[area.id]
        assert get_cached_ascent_count(area) == expected_ascent_counts[area.id]
        assert area.line_count == expected_line_counts[area.id]
        assert area.ascent_count == expected_ascent_counts[area.id]


def test_attach_line_ascent_counts_matches_uncached_hybrid_property():
    lines = Line.query.order_by(Line.name).all()
    expected_ascent_counts = {line.id: line.ascent_count for line in lines}

    attach_line_ascent_counts(lines)

    for line in lines:
        assert get_cached_line_ascent_count(line) == expected_ascent_counts[line.id]
        assert line.ascent_count == expected_ascent_counts[line.id]


def test_attach_crag_counts_excludes_secret_lines_without_view_access(client, moderator_token):
    crag = Crag.find_by_slug("brione")
    expected_line_count = crag.line_count
    expected_ascent_count = crag.ascent_count

    rv = client.post("/api/areas/shark-attack/lines", token=moderator_token, json=_secret_line_payload())
    assert rv.status_code == 201

    crags = [Crag.find_by_slug("brione")]
    attach_crag_counts(crags)

    assert get_cached_line_count(crags[0]) == expected_line_count
    assert get_cached_ascent_count(crags[0]) == expected_ascent_count


def test_get_crags_list_counts_match_batch_prefetch(client, moderator_token):
    """List endpoint counts must match hybrid properties (uses batch prefetch internally)."""
    crag = Crag.find_by_slug("brione")
    expected_line_count = crag.line_count
    expected_ascent_count = crag.ascent_count

    rv = client.post("/api/areas/shark-attack/lines", token=moderator_token, json=_secret_line_payload())
    assert rv.status_code == 201

    rv = client.get("/api/crags")
    assert rv.status_code == 200
    brione = next(item for item in rv.json if item["slug"] == "brione")
    assert brione["lineCount"] == expected_line_count
    assert brione["ascentCount"] == expected_ascent_count


def test_attach_secret_flags_matches_registry():
    crags = Crag.query.all()
    expected = {crag.id: SecretService.is_secret(crag.id) for crag in crags}

    SecretService.attach_secret_flags(crags)

    for crag in crags:
        assert crag.secret == expected[crag.id]


def test_attach_secret_flags_for_lines():
    lines = Line.query.limit(10).all()
    expected = {line.id: SecretService.is_secret(line.id) for line in lines}

    SecretService.attach_secret_flags(lines)

    for line in lines:
        assert line.secret == expected[line.id]


def test_attach_counts_noop_on_empty_lists():
    attach_crag_counts([])
    attach_sector_counts([])
    attach_area_counts([])
    attach_line_ascent_counts([])
    SecretService.attach_secret_flags([])
