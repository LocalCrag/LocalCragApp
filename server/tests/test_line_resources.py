import datetime

import pytz

from extensions import db
from models.area import Area
from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.file import File
from models.line import Line
from models.line_path import LinePath
from models.topo_image import TopoImage


def test_successful_move_line_to_different_area(client, moderator_token):
    """A line can be re-parented to another area."""
    line: Line = Line.find_by_slug("super-spreader")
    original_area_id = str(line.area_id)

    target_area_obj = Area.query.filter(Area.id != line.area_id).first()
    assert target_area_obj is not None

    rv = client.put(
        f"/api/lines/{line.slug}/move",
        token=moderator_token,
        json={"areaId": str(target_area_obj.id)},
    )
    assert rv.status_code == 200
    res = rv.json
    assert res["slug"] == line.slug

    moved_line = Line.find_by_slug(line.slug)
    assert str(moved_line.area_id) != original_area_id


def test_move_line_deletes_all_line_paths(client, moderator_token):
    line: Line = Line.find_by_slug("super-spreader")

    # Ensure two topo images exist in the source area.
    topo_images = TopoImage.query.filter_by(area_id=line.area_id).order_by(TopoImage.order_index.asc()).all()
    assert len(topo_images) > 0
    topo_image_1 = topo_images[0]
    if len(topo_images) > 1:
        topo_image_2 = topo_images[1]
    else:
        other_file = File.query.filter(File.id != topo_image_1.file_id).first()
        assert other_file is not None
        topo_image_2 = TopoImage(
            area_id=line.area_id,
            file_id=other_file.id,
            created_by_id=topo_image_1.created_by_id,
            order_index=topo_image_1.order_index + 1,
            title=None,
            description=None,
            archived=False,
        )

        db.session.add(topo_image_2)
        db.session.commit()

    # Create two line paths for this line
    LinePath.query.filter_by(line_id=line.id).delete(synchronize_session=False)

    lp1 = LinePath(
        topo_image_id=topo_image_1.id,
        line_id=line.id,
        created_by_id=topo_image_1.created_by_id,
        order_index=0,
        order_index_for_line=0,
        path=[1.0, 1.0, 2.0, 2.0],
    )
    lp2 = LinePath(
        topo_image_id=topo_image_2.id,
        line_id=line.id,
        created_by_id=topo_image_2.created_by_id,
        order_index=0,
        order_index_for_line=1,
        path=[3.0, 3.0, 4.0, 4.0],
    )
    db.session.add(lp1)
    db.session.add(lp2)
    db.session.commit()

    assert LinePath.query.filter_by(line_id=line.id).count() == 2

    target_area_obj = Area.query.filter(Area.id != line.area_id).first()
    assert target_area_obj is not None

    rv = client.put(
        f"/api/lines/{line.slug}/move",
        token=moderator_token,
        json={"areaId": str(target_area_obj.id)},
    )
    assert rv.status_code == 200

    assert LinePath.query.filter_by(line_id=line.id).count() == 0


def test_successful_create_line(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "color": "#334433",
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "morpho": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["name"] == "Es"
    assert res["slug"] == "es"
    assert res["description"] == "Super Boulder"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res["color"] == "#334433"
    assert res["authorGradeValue"] == 19
    assert "userGradeValue" in res
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert "userRating" in res
    assert res["ascentCount"] == 0
    assert res["faYear"] == 2016
    assert res["faDate"] is None
    assert res["faName"] == "Dave Graham"
    assert res["startingPosition"] == "FRENCH"
    assert res["eliminate"] is True
    assert res["traverse"] is True
    assert res["highball"] is True
    assert res["lowball"] is True
    assert res["morpho"] is True
    assert res["noTopout"] is True
    assert res["badDropzone"] is True
    assert res["childFriendly"] is True
    assert res["roof"] is True
    assert res["slab"] is True
    assert res["vertical"] is True
    assert res["overhang"] is True
    assert res["athletic"] is True
    assert res["technical"] is True
    assert res["endurance"] is True
    assert res["cruxy"] is True
    assert res["dyno"] is True
    assert res["jugs"] is True
    assert res["sloper"] is True
    assert res["crimps"] is True
    assert res["pockets"] is True
    assert res["pinches"] is True
    assert res["crack"] is True
    assert res["dihedral"] is True
    assert res["compression"] is True
    assert res["arete"] is True
    assert res["mantle"] is True
    assert res["secret"] is False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 0
    assert res["closed"] is False
    assert res["closedReasons"] == []


def test_successful_create_line_with_project_status(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": -1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "morpho": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["name"] == "Es"
    assert res["slug"] == "es"
    assert res["description"] == "Super Boulder"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res["videos"][0]["title"] == "Video"
    assert res["authorGradeValue"] == -1
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert res["ascentCount"] == 0
    assert res["faYear"] is None  # Should be set to None automatically for projects!
    assert res["faName"] is None  # Should be set to None automatically for projects!
    assert res["startingPosition"] == "FRENCH"
    assert res["eliminate"] is True
    assert res["traverse"] is True
    assert res["highball"] is True
    assert res["morpho"] is True
    assert res["lowball"] is True
    assert res["noTopout"] is True
    assert res["badDropzone"] is True
    assert res["childFriendly"] is True
    assert res["roof"] is True
    assert res["slab"] is True
    assert res["vertical"] is True
    assert res["overhang"] is True
    assert res["athletic"] is True
    assert res["technical"] is True
    assert res["endurance"] is True
    assert res["cruxy"] is True
    assert res["dyno"] is True
    assert res["jugs"] is True
    assert res["sloper"] is True
    assert res["crimps"] is True
    assert res["pockets"] is True
    assert res["pinches"] is True
    assert res["crack"] is True
    assert res["dihedral"] is True
    assert res["compression"] is True
    assert res["arete"] is True
    assert res["mantle"] is True
    assert res["secret"] is False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 0
    assert res["closed"] is False
    assert res["closedReasons"] == []


def test_create_line_invalid_fa_year(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 9000,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_rating(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 6,
        "faYear": 2014,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_video_url(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "sdfsdfsdf", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2014,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_grade_value(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 42,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2000,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_grade_scale_for_line_type(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "TRAD",
        "authorRating": 5,
        "faYear": 2000,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_grade_scale(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "TRESGDFGD",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2000,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_line_type(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "WEIRD",
        "authorRating": 5,
        "faYear": 2000,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_line_starting_position(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2000,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "PRE_CLIPPED",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_video_payload(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            }
        ],
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "WEIRD",
        "authorRating": 5,
        "faYear": 2000,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "SIT",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_line_invalid_color(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "color": "#0x3120",
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "morpho": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_successful_get_lines(client):
    lines = Line.query.all()

    rv = client.get("/api/lines")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert len(res) == len(lines)
    for r, line in zip(sorted(res, key=lambda r: r["id"]), sorted(lines, key=lambda l: str(l.id))):  # noqa: E741
        assert r["id"] == str(line.id)
        assert r["slug"] == line.slug
        assert r["name"] == line.name
        assert r["ascentCount"] == line.ascent_count
        assert r["secret"] == line.secret
        assert r["color"] == line.color
        assert len(r["linePaths"]) == len(line.line_paths)
        assert r["closed"] == line.closed
        assert "closedReasons" not in r
        assert "closureSchedules" not in r


def test_successful_get_lines_order_by_ascent_count_ascending(client):
    rv = client.get("/api/lines?order_by=ascent_count&order_direction=asc")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert [line["slug"] for line in res] == ["treppe", "super-spreader"]


def test_successful_get_lines_order_by_ascent_count_descending(client):
    rv = client.get("/api/lines?order_by=ascent_count&order_direction=desc")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert [line["slug"] for line in res] == ["super-spreader", "treppe"]


def test_successful_get_lines_order_by_name_ascending_regression(client):
    rv = client.get("/api/lines?order_by=name&order_direction=asc")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert [line["slug"] for line in res] == ["super-spreader", "treppe"]


def test_successful_get_lines_order_by_time_created_ascending(client):
    treppe = Line.find_by_slug("treppe")
    super_spreader = Line.find_by_slug("super-spreader")
    treppe.time_created = datetime.datetime(2020, 1, 1, tzinfo=pytz.utc)
    super_spreader.time_created = datetime.datetime(2021, 1, 1, tzinfo=pytz.utc)
    db.session.commit()

    rv = client.get("/api/lines?order_by=time_created&order_direction=asc")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert [line["slug"] for line in res] == ["treppe", "super-spreader"]


def test_successful_get_lines_order_by_time_created_descending(client):
    treppe = Line.find_by_slug("treppe")
    super_spreader = Line.find_by_slug("super-spreader")
    treppe.time_created = datetime.datetime(2020, 1, 1, tzinfo=pytz.utc)
    super_spreader.time_created = datetime.datetime(2021, 1, 1, tzinfo=pytz.utc)
    db.session.commit()

    rv = client.get("/api/lines?order_by=time_created&order_direction=desc")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert [line["slug"] for line in res] == ["super-spreader", "treppe"]


def test_successful_get_lines_order_by_topo_position_ascending(client):
    rv = client.get("/api/lines?order_by=topo_position&order_direction=asc")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert [line["slug"] for line in res] == ["treppe", "super-spreader"]


def test_successful_get_lines_order_by_topo_position_descending(client):
    rv = client.get("/api/lines?order_by=topo_position&order_direction=desc")
    assert rv.status_code == 200
    res = rv.json["items"]
    assert [line["slug"] for line in res] == ["super-spreader", "treppe"]


def test_get_lines_order_by_topo_position_respects_area_order_within_sector(client):
    """Topo image order_index is per-area; sector/crag lists must sort by area order first."""
    first_area = Area.find_by_slug("dritter-block-von-links")
    second_area = Area.find_by_slug("noch-ein-bereich")
    template_topo = TopoImage.query.filter_by(area_id=first_area.id).first()
    admin_id = template_topo.created_by_id

    second_area_topo = TopoImage(
        area_id=second_area.id,
        file_id=template_topo.file_id,
        created_by_id=admin_id,
        order_index=0,
        title=None,
        description=None,
        archived=False,
    )
    db.session.add(second_area_topo)
    db.session.flush()

    second_area_line = Line()
    second_area_line.name = "Second Area Topo First"
    second_area_line.area_id = second_area.id
    second_area_line.grade_scale = "FB"
    second_area_line.author_grade_value = 10
    second_area_line.user_grade_value = 10
    second_area_line.type = LineTypeEnum.BOULDER
    second_area_line.starting_position = StartingPositionEnum.SIT
    db.session.add(second_area_line)
    db.session.flush()

    db.session.add(
        LinePath(
            topo_image_id=second_area_topo.id,
            line_id=second_area_line.id,
            created_by_id=admin_id,
            order_index=0,
            order_index_for_line=0,
            path=[1.0, 1.0, 2.0, 2.0],
        )
    )
    db.session.commit()

    rv = client.get("/api/lines?sector_slug=schattental&order_by=topo_position&order_direction=asc")
    assert rv.status_code == 200
    assert [line["slug"] for line in rv.json["items"]] == [
        second_area_line.slug,
        "treppe",
        "super-spreader",
    ]

    rv = client.get("/api/lines?crag_slug=brione&order_by=topo_position&order_direction=asc")
    assert rv.status_code == 200
    assert [line["slug"] for line in rv.json["items"]] == [
        second_area_line.slug,
        "treppe",
        "super-spreader",
    ]

    rv = client.get("/api/lines?sector_slug=schattental&order_by=topo_position&order_direction=desc")
    assert rv.status_code == 200
    assert [line["slug"] for line in rv.json["items"]] == [
        "super-spreader",
        "treppe",
        second_area_line.slug,
    ]


def test_get_lines_order_by_topo_position_lines_without_paths_last(client):
    template = Line.find_by_slug("super-spreader")
    line_without_paths = Line()
    line_without_paths.name = "No Topo Line"
    line_without_paths.area_id = template.area_id
    line_without_paths.grade_scale = "FB"
    line_without_paths.author_grade_value = 10
    line_without_paths.user_grade_value = 10
    line_without_paths.type = LineTypeEnum.BOULDER
    line_without_paths.starting_position = StartingPositionEnum.SIT
    db.session.add(line_without_paths)
    db.session.commit()

    rv = client.get("/api/lines?order_by=topo_position&order_direction=asc")
    assert rv.status_code == 200
    assert [line["slug"] for line in rv.json["items"]][-1] == line_without_paths.slug

    rv = client.get("/api/lines?order_by=topo_position&order_direction=desc")
    assert rv.status_code == 200
    assert [line["slug"] for line in rv.json["items"]][-1] == line_without_paths.slug

    db.session.delete(line_without_paths)
    db.session.commit()


def test_successful_get_line(client):
    rv = client.get("/api/lines/super-spreader")
    assert rv.status_code == 200
    res = rv.json
    assert res["name"] == "Super-Spreader"
    assert res["slug"] == "super-spreader"
    assert res["description"] == "<p>Geiler Kühlschrankboulder!</p>"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=8A_9oHuTkQA"
    assert res["color"] is None
    assert res["authorGradeValue"] == 22
    assert "userGradeValue" in res
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert res["ascentCount"] == 1
    assert res["faYear"] == 2024
    assert res["faDate"] is None
    assert res["faName"] == "Felix Engelmann"
    assert res["startingPosition"] == "SIT"
    assert res["eliminate"] is False
    assert res["traverse"] is False
    assert res["highball"] is False
    assert res["lowball"] is False
    assert res["morpho"] is False
    assert res["noTopout"] is True
    assert res["badDropzone"] is False
    assert res["childFriendly"] is False
    assert res["roof"] is False
    assert res["slab"] is False
    assert res["vertical"] is False
    assert res["overhang"] is True
    assert res["athletic"] is True
    assert res["technical"] is False
    assert res["endurance"] is False
    assert res["cruxy"] is True
    assert res["dyno"] is False
    assert res["jugs"] is False
    assert res["sloper"] is True
    assert res["crimps"] is False
    assert res["pockets"] is False
    assert res["pinches"] is False
    assert res["crack"] is False
    assert res["dihedral"] is False
    assert res["compression"] is True
    assert res["arete"] is False
    assert res["mantle"] is False
    assert res["secret"] is False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 2
    assert isinstance(res["linePaths"][0]["topoImage"]["id"], str)
    assert res["linePaths"][0]["orderIndex"] == 0
    assert res["linePaths"][0]["topoImage"]["orderIndex"] == 0
    assert res["closed"] is False
    assert res["closedReasons"] == []


def test_get_deleted_line(client):
    rv = client.get("/api/lines/linie-existiert-nicht-mehr")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_line(client, moderator_token):
    rv = client.delete("/api/lines/super-spreader", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_line(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "color": "#123456",
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "STAND",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "morpho": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.put("/api/lines/treppe", token=moderator_token, json=line_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["name"] == "Es"
    assert res["slug"] == "es"
    assert res["description"] == "Super Boulder"
    assert res["videos"][0]["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert res["color"] == "#123456"
    assert res["authorGradeValue"] == 19
    assert res["gradeScale"] == "FB"
    assert res["type"] == "BOULDER"
    assert res["authorRating"] == 5
    assert res["ascentCount"] == 0
    assert res["faYear"] == 2016
    assert res["faDate"] is None
    assert res["faName"] == "Dave Graham"
    assert res["startingPosition"] == "STAND"
    assert res["eliminate"] is True
    assert res["traverse"] is True
    assert res["highball"] is True
    assert res["lowball"] is True
    assert res["morpho"] is True
    assert res["noTopout"] is True
    assert res["badDropzone"] is True
    assert res["childFriendly"] is True
    assert res["roof"] is True
    assert res["slab"] is True
    assert res["vertical"] is True
    assert res["overhang"] is True
    assert res["athletic"] is True
    assert res["technical"] is True
    assert res["endurance"] is True
    assert res["cruxy"] is True
    assert res["dyno"] is True
    assert res["jugs"] is True
    assert res["sloper"] is True
    assert res["crimps"] is True
    assert res["pockets"] is True
    assert res["pinches"] is True
    assert res["crack"] is True
    assert res["dihedral"] is True
    assert res["compression"] is True
    assert res["arete"] is True
    assert res["mantle"] is True
    assert res["secret"] is False
    assert res["id"] is not None
    assert len(res["linePaths"]) == 1
    assert isinstance(res["linePaths"][0]["topoImage"]["id"], str)
    assert res["linePaths"][0]["orderIndex"] == 1
    assert res["linePaths"][0]["topoImage"]["orderIndex"] == 0
    assert res["closed"] is False
    assert res["closedReasons"] == []


def test_edit_line_change_grade_to_project_if_line_has_ascents(client, moderator_token):
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "gradeValue": -1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "STAND",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "lowball": True,
        "morpho": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closureSchedules": [],
    }

    rv = client.put("/api/lines/super-spreader", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_successful_get_lines_for_line_editor(client):
    rv = client.get("/api/lines/for-line-editor/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2


def test_create_line_with_fa_date_only(client, moderator_token):
    line_data = {
        "name": "DateOnly",
        "description": "FA Date Only Test",
        "videos": [],
        "authorGradeValue": 10,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 3,
        "faYear": None,
        "faDate": "2020-05-15",
        "faName": "Test Climber",
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
        "secret": False,
        "closureSchedules": [],
    }
    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    print(rv.data)
    assert rv.status_code == 201
    res = rv.json
    assert res["faYear"] is None
    assert res["faDate"] == "2020-05-15"


def test_create_line_with_fa_date_and_year_raises_400(client, moderator_token):
    line_data = {
        "name": "DateAndYear",
        "description": "FA Date and Year Test",
        "videos": [],
        "authorGradeValue": 10,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 3,
        "faYear": 2020,
        "faDate": "2020-05-15",
        "faName": "Test Climber",
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
        "secret": False,
        "closureSchedules": [],
    }
    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_create_project_line_with_fa_date_and_year_raises_400(client, moderator_token):
    line_data = {
        "name": "ProjectWithBothFaFields",
        "description": "Project with both FA year and date",
        "videos": [],
        "authorGradeValue": -1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": "2020-05-15",
        "faName": "Dave Graham",
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
        "secret": False,
        "closureSchedules": [],
    }
    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 400


def test_get_lines_rejects_invalid_required_bool(client):
    rv = client.get("/api/lines?required_bools=notARealKey")
    assert rv.status_code == 400


def test_get_lines_required_bools_highball_filters_lines(client):
    """required_bools must constrain to lines where the flag is true in the database."""
    rv = client.get("/api/lines?required_bools=highball&per_page=50")
    assert rv.status_code == 200
    assert rv.json["items"] == []

    line: Line = Line.find_by_slug("treppe")
    line.highball = True
    db.session.add(line)
    db.session.commit()

    rv2 = client.get("/api/lines?required_bools=highball&per_page=50")
    assert rv2.status_code == 200
    slugs = {item["slug"] for item in rv2.json["items"]}
    assert slugs == {"treppe"}
    assert all(item["highball"] is True for item in rv2.json["items"])


def test_get_lines_rejects_partial_grade_filter(client):
    rv = client.get("/api/lines?min_grade=0")
    assert rv.status_code == 400


def test_get_lines_rejects_invalid_starting_position(client):
    rv = client.get("/api/lines?starting_position=NOT_A_POSITION")
    assert rv.status_code == 400


def test_get_lines_starting_position_filters_lines(client):
    rv = client.get("/api/lines?starting_position=SIT&per_page=50")
    assert rv.status_code == 200
    slugs = {item["slug"] for item in rv.json["items"]}
    assert slugs == {"super-spreader"}
    assert all(item["startingPosition"] == "SIT" for item in rv.json["items"])
