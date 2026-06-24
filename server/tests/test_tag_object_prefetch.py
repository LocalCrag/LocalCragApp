"""Tests for gallery tag object batch prefetch."""

from models.line import Line
from models.tag import Tag
from util.tag_object_prefetch import prefetch_tag_objects


def test_prefetch_tag_objects_resolves_line_and_user_targets():
    tags = Tag.query.limit(20).all()
    assert tags, "fixture data should include tags"

    prefetch_tag_objects(tags)

    for tag in tags:
        if tag.object_type not in {"Line", "Area", "Sector", "Crag", "User"}:
            continue
        assert tag.object is not None
        assert tag.object.id == tag.object_id


def test_get_gallery_list_resolves_tag_objects(client):
    line = Line.find_by_slug("super-spreader")

    rv = client.get("/api/gallery?page=1&tag-object-type=Line&tag-object-slug=super-spreader")
    assert rv.status_code == 200
    assert len(rv.json["items"]) >= 1

    tag = rv.json["items"][0]["tags"][0]
    assert tag["objectType"] == "Line"
    assert tag["object"]["id"] == str(line.id)
    assert tag["object"]["slug"] == line.slug
    assert tag["object"]["name"] == line.name


def test_get_gallery_global_list_resolves_mixed_tag_objects(client):
    rv = client.get("/api/gallery")
    assert rv.status_code == 200
    assert len(rv.json["items"]) >= 1

    for item in rv.json["items"]:
        for tag in item["tags"]:
            assert tag["object"] is not None
            assert tag["object"]["id"] is not None
            if tag["objectType"] == "Line":
                assert tag["object"]["slug"] is not None
                assert tag["object"]["name"] is not None


def test_prefetch_tag_objects_noop_on_empty_list():
    prefetch_tag_objects([])
