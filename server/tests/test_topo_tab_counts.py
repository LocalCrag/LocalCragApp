"""Tests for tab count fields on topo detail endpoints (issue #1056).

Covers hierarchy / ascent / image / comment counts and secret-spot visibility.
"""

from extensions import db
from models.area import Area
from models.comment import Comment
from models.crag import Crag
from models.file import File
from models.line import Line
from models.region import Region
from models.sector import Sector
from models.user import User
from util.propagating_boolean_attrs import (
    update_area_propagating_boolean_attr,
    update_crag_propagating_boolean_attr,
    update_sector_propagating_boolean_attr,
)
from util.topo_tab_counts import count_gallery_images, count_root_comments


def _secret_line_payload(name="Tab Count Secret Line"):
    return {
        "name": name,
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


def test_count_gallery_images_matches_seed_hierarchy():
    crag = Crag.find_by_slug("brione")
    line = Line.find_by_slug("super-spreader")
    area = Area.find_by_slug("shark-attack")
    sector = Sector.find_by_slug("pampelmousse")

    # Seed: one image tagged on Brione, one on Super-Spreader (child of Brione).
    assert count_gallery_images("Line", line.id) == 1
    assert count_gallery_images("Area", area.id) == 1
    assert count_gallery_images("Sector", sector.id) == 1
    assert count_gallery_images("Crag", crag.id) == 2


def test_count_root_comments_excludes_replies(client, member_token):
    line = Line.find_by_slug("super-spreader")
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()

    root = Comment()
    root.message = "Root comment"
    root.object_type = "Line"
    root.object_id = line.id
    root.created_by_id = user.id
    db.session.add(root)
    db.session.flush()

    reply = Comment()
    reply.message = "Reply"
    reply.object_type = "Line"
    reply.object_id = line.id
    reply.parent_id = root.id
    reply.root_id = root.id
    reply.created_by_id = user.id
    db.session.add(reply)
    db.session.commit()

    assert count_root_comments("Line", line.id) == 1
    assert line.comment_count == 1


def test_crag_detail_includes_tab_counts(client):
    crag = Crag.find_by_slug("brione")
    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == crag.image_count
    assert rv.json["commentCount"] == crag.comment_count
    assert rv.json["sectorCount"] == crag.sector_count
    assert rv.json["imageCount"] == 2
    assert rv.json["commentCount"] == 0
    assert rv.json["sectorCount"] == 2
    assert rv.json["lineCount"] == crag.line_count


def test_sector_detail_includes_tab_counts(client):
    sector = Sector.find_by_slug("pampelmousse")
    rv = client.get("/api/sectors/pampelmousse")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == sector.image_count
    assert rv.json["commentCount"] == sector.comment_count
    assert rv.json["areaCount"] == sector.area_count
    assert rv.json["areaCount"] == 2
    assert rv.json["lineCount"] == sector.line_count


def test_area_detail_includes_tab_counts(client):
    area = Area.find_by_slug("shark-attack")
    rv = client.get("/api/areas/shark-attack")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == area.image_count
    assert rv.json["commentCount"] == area.comment_count
    assert rv.json["lineCount"] == area.line_count
    assert rv.json["topoImageCount"] == area.topo_image_count
    assert rv.json["topoImageCount"] == 2


def test_area_topo_image_count_excludes_archived(client):
    area = Area.find_by_slug("shark-attack")
    from models.topo_image import TopoImage

    topo_image = TopoImage.query.filter_by(area_id=area.id).order_by(TopoImage.order_index).first()
    assert topo_image is not None
    baseline = area.topo_image_count
    assert baseline == 2

    topo_image.archived = True
    db.session.commit()

    rv = client.get("/api/areas/shark-attack")
    assert rv.status_code == 200
    assert rv.json["topoImageCount"] == baseline - 1


def test_line_detail_includes_tab_counts(client):
    line = Line.find_by_slug("super-spreader")
    rv = client.get("/api/lines/super-spreader")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == line.image_count
    assert rv.json["commentCount"] == line.comment_count
    assert rv.json["imageCount"] == 1


def test_crag_list_omits_tab_counts(client):
    rv = client.get("/api/crags")
    assert rv.status_code == 200
    assert "imageCount" not in rv.json[0]
    assert "commentCount" not in rv.json[0]
    assert "sectorCount" not in rv.json[0]


def test_region_detail_includes_tab_counts(client, moderator_token):
    region = Region.return_it()
    rv = client.get("/api/region")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == region.image_count
    assert rv.json["commentCount"] == region.comment_count
    assert rv.json["cragCount"] == region.crag_count
    assert rv.json["lineCount"] == region.line_count
    # Region gallery is unfiltered: seed has 2 images.
    assert rv.json["imageCount"] == 2
    assert rv.json["commentCount"] == 0
    assert rv.json["cragCount"] == 2
    assert rv.json["lineCount"] == 2
    assert "taskCount" not in rv.json
    assert client.get("/api/region", token=moderator_token).json["taskCount"] == 0


def test_secret_line_excluded_from_parent_counts_for_anonymous(client, moderator_token, member_token):
    """Secret lines must not inflate public line/ascent counts; members still see them."""
    baseline_crag = client.get("/api/crags/brione").json
    baseline_sector = client.get("/api/sectors/pampelmousse").json
    baseline_area = client.get("/api/areas/shark-attack").json
    baseline_region = client.get("/api/region").json

    rv = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_secret_line_payload(),
    )
    assert rv.status_code == 201
    secret_line_id = rv.json["id"]

    ascent_data = {
        "flash": False,
        "fa": False,
        "soft": False,
        "hard": False,
        "withKneepad": False,
        "rating": 2,
        "comment": None,
        "year": None,
        "gradeValue": 11,
        "line": secret_line_id,
        "date": "2024-05-01",
    }
    rv = client.post("/api/ascents", token=member_token, json=ascent_data)
    assert rv.status_code == 201

    anon_crag = client.get("/api/crags/brione").json
    anon_sector = client.get("/api/sectors/pampelmousse").json
    anon_area = client.get("/api/areas/shark-attack").json
    anon_region = client.get("/api/region").json

    assert anon_crag["lineCount"] == baseline_crag["lineCount"]
    assert anon_crag["ascentCount"] == baseline_crag["ascentCount"]
    assert anon_sector["lineCount"] == baseline_sector["lineCount"]
    assert anon_sector["ascentCount"] == baseline_sector["ascentCount"]
    assert anon_area["lineCount"] == baseline_area["lineCount"]
    assert anon_area["ascentCount"] == baseline_area["ascentCount"]
    assert anon_region["lineCount"] == baseline_region["lineCount"]
    assert anon_region["ascentCount"] == baseline_region["ascentCount"]

    member_crag = client.get("/api/crags/brione", token=member_token).json
    member_sector = client.get("/api/sectors/pampelmousse", token=member_token).json
    member_area = client.get("/api/areas/shark-attack", token=member_token).json
    member_region = client.get("/api/region", token=member_token).json

    assert member_crag["lineCount"] == baseline_crag["lineCount"] + 1
    assert member_crag["ascentCount"] == baseline_crag["ascentCount"] + 1
    assert member_sector["lineCount"] == baseline_sector["lineCount"] + 1
    assert member_sector["ascentCount"] == baseline_sector["ascentCount"] + 1
    assert member_area["lineCount"] == baseline_area["lineCount"] + 1
    assert member_area["ascentCount"] == baseline_area["ascentCount"] + 1
    assert member_region["lineCount"] == baseline_region["lineCount"] + 1
    assert member_region["ascentCount"] == baseline_region["ascentCount"] + 1


def test_secret_gallery_image_excluded_from_image_counts_for_anonymous(client, moderator_token, member_token):
    baseline_crag = client.get("/api/crags/brione").json["imageCount"]
    baseline_region = client.get("/api/region").json["imageCount"]

    rv = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_secret_line_payload("Secret Gallery Line"),
    )
    assert rv.status_code == 201
    line_id = rv.json["id"]

    file_id = File.query.filter_by(original_filename="Hate it or love it.JPG").first().id
    rv = client.post(
        "/api/gallery",
        token=member_token,
        json={"fileId": file_id, "tags": [{"objectType": "Line", "objectId": line_id}]},
    )
    assert rv.status_code == 201

    assert client.get("/api/crags/brione").json["imageCount"] == baseline_crag
    assert client.get("/api/region").json["imageCount"] == baseline_region
    assert client.get("/api/crags/brione", token=member_token).json["imageCount"] == baseline_crag + 1
    assert client.get("/api/region", token=member_token).json["imageCount"] == baseline_region + 1


def test_secret_sector_excluded_from_crag_sector_count(client, member_token):
    baseline = client.get("/api/crags/brione").json["sectorCount"]
    assert baseline == 2

    sector = Sector.find_by_slug("upper-brione")
    update_sector_propagating_boolean_attr(sector, True, "secret")
    db.session.commit()

    assert client.get("/api/crags/brione").json["sectorCount"] == baseline - 1
    assert client.get("/api/crags/brione", token=member_token).json["sectorCount"] == baseline


def test_secret_area_excluded_from_sector_area_count(client, member_token):
    baseline = client.get("/api/sectors/pampelmousse").json["areaCount"]
    assert baseline == 2

    area = Area.find_by_slug("another-area")
    update_area_propagating_boolean_attr(area, True, "secret")
    db.session.commit()

    assert client.get("/api/sectors/pampelmousse").json["areaCount"] == baseline - 1
    assert client.get("/api/sectors/pampelmousse", token=member_token).json["areaCount"] == baseline


def test_secret_crag_excluded_from_region_crag_count(client, member_token):
    baseline = client.get("/api/region").json["cragCount"]
    assert baseline == 2

    crag = Crag.find_by_slug("chironico")
    update_crag_propagating_boolean_attr(crag, True, "secret")
    db.session.commit()

    assert client.get("/api/region").json["cragCount"] == baseline - 1
    assert client.get("/api/region", token=member_token).json["cragCount"] == baseline


def test_comment_count_is_scoped_to_entity_not_secret_children(client, member_token):
    """Parent commentCount only counts comments on that entity (not secret child threads)."""
    crag = Crag.find_by_slug("brione")
    line = Line.find_by_slug("super-spreader")
    user = User.query.filter_by(email="user@localcrag.invalid.org").first()

    line_comment = Comment()
    line_comment.message = "On secret-capable child"
    line_comment.object_type = "Line"
    line_comment.object_id = line.id
    line_comment.created_by_id = user.id
    db.session.add(line_comment)
    db.session.commit()

    # Make the line secret after commenting; parent crag comment count stays 0.
    line.secret = True
    db.session.commit()

    assert client.get("/api/crags/brione").json["commentCount"] == 0
    assert client.get("/api/crags/brione", token=member_token).json["commentCount"] == 0
    assert crag.comment_count == 0


def test_open_task_count_includes_child_scope_and_excludes_completed(client, moderator_token):
    """taskCount is incomplete tasks in hierarchical scope (same as the task list)."""
    region = Region.return_it()
    line_id = Line.get_id_by_slug("the-vessel")

    assert client.get("/api/region", token=moderator_token).json["taskCount"] == 0
    assert client.get("/api/crags/brione", token=moderator_token).json["taskCount"] == 0
    assert client.get("/api/lines/the-vessel", token=moderator_token).json["taskCount"] == 0

    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Line open task",
            "objectType": "Line",
            "objectId": str(line_id),
        },
    )
    assert rv.status_code == 201
    line_task_id = rv.json["id"]

    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Region open task",
            "objectType": "Region",
            "objectId": str(region.id),
        },
    )
    assert rv.status_code == 201
    region_task_id = rv.json["id"]

    assert client.get("/api/lines/the-vessel", token=moderator_token).json["taskCount"] == 1
    assert client.get("/api/areas/shark-attack", token=moderator_token).json["taskCount"] == 1
    assert client.get("/api/sectors/pampelmousse", token=moderator_token).json["taskCount"] == 1
    assert client.get("/api/crags/brione", token=moderator_token).json["taskCount"] == 1
    assert client.get("/api/region", token=moderator_token).json["taskCount"] == 2

    rv = client.post(f"/api/moderator-tasks/{line_task_id}/toggle-complete", token=moderator_token)
    assert rv.status_code == 200
    assert rv.json["completed"] is True

    assert client.get("/api/lines/the-vessel", token=moderator_token).json["taskCount"] == 0
    assert client.get("/api/crags/brione", token=moderator_token).json["taskCount"] == 0
    assert client.get("/api/region", token=moderator_token).json["taskCount"] == 1

    rv = client.post(f"/api/moderator-tasks/{region_task_id}/toggle-complete", token=moderator_token)
    assert rv.status_code == 200
    assert client.get("/api/region", token=moderator_token).json["taskCount"] == 0


def test_task_count_omitted_for_non_moderators(client, moderator_token, member_token, user_token):
    """taskCount must be absent for anonymous, member, and non-member users."""
    region = Region.return_it()
    line_id = Line.get_id_by_slug("the-vessel")

    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Visible only to moderators",
            "objectType": "Line",
            "objectId": str(line_id),
        },
    )
    assert rv.status_code == 201

    endpoints = (
        "/api/region",
        "/api/crags/brione",
        "/api/sectors/pampelmousse",
        "/api/areas/shark-attack",
        "/api/lines/the-vessel",
    )
    for endpoint in endpoints:
        assert "taskCount" not in client.get(endpoint).json
        assert "taskCount" not in client.get(endpoint, token=member_token).json
        assert "taskCount" not in client.get(endpoint, token=user_token).json
        assert client.get(endpoint, token=moderator_token).json["taskCount"] >= 1

    # Region-scoped task also stays hidden from non-moderators.
    rv = client.post(
        "/api/moderator-tasks",
        token=moderator_token,
        json={
            "title": "Region task",
            "objectType": "Region",
            "objectId": str(region.id),
        },
    )
    assert rv.status_code == 201
    assert "taskCount" not in client.get("/api/region").json
    assert "taskCount" not in client.get("/api/region", token=member_token).json
    assert client.get("/api/region", token=moderator_token).json["taskCount"] >= 2
