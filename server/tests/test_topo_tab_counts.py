"""Tests for imageCount / commentCount on topo detail endpoints (issue #1056)."""

from extensions import db
from models.area import Area
from models.comment import Comment
from models.crag import Crag
from models.line import Line
from models.sector import Sector
from models.user import User
from util.topo_tab_counts import count_gallery_images, count_root_comments


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
    assert rv.json["imageCount"] == 2
    assert rv.json["commentCount"] == 0


def test_sector_detail_includes_tab_counts(client):
    sector = Sector.find_by_slug("pampelmousse")
    rv = client.get("/api/sectors/pampelmousse")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == sector.image_count
    assert rv.json["commentCount"] == sector.comment_count


def test_area_detail_includes_tab_counts(client):
    area = Area.find_by_slug("shark-attack")
    rv = client.get("/api/areas/shark-attack")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == area.image_count
    assert rv.json["commentCount"] == area.comment_count


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


def test_region_detail_includes_tab_counts(client):
    from models.region import Region

    region = Region.return_it()
    rv = client.get("/api/region")
    assert rv.status_code == 200
    assert rv.json["imageCount"] == region.image_count
    assert rv.json["commentCount"] == region.comment_count
    # Region gallery is unfiltered: seed has 2 images.
    assert rv.json["imageCount"] == 2
    assert rv.json["commentCount"] == 0
