import datetime

from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.comment import Comment
from models.enums.line_type_enum import LineTypeEnum
from models.enums.starting_position_enum import StartingPositionEnum
from models.enums.todo_priority_enum import TodoPriorityEnum
from models.instance_settings import InstanceSettings
from models.line import Line
from models.todo import Todo
from models.user import User
from util.secret_service import SecretService


def _add_line(name, grade, fa_year=None):
    area = Area.find_by_slug("shark-attack")
    line = Line()
    line.name = name
    line.type = LineTypeEnum.BOULDER
    line.area_id = area.id
    line.grade_scale = "FB"
    line.author_grade_value = grade
    line.user_grade_value = grade
    line.starting_position = StartingPositionEnum.STAND
    line.fa_year = fa_year
    db.session.add(line)
    db.session.flush()
    return line


def _add_ascent(line, user_id, grade, flash=False, soft=False, hard=False, rating=None, date=None, year=None):
    ascent = Ascent()
    ascent.line_id = line.id
    ascent.created_by_id = user_id
    ascent.grade_value = grade
    ascent.flash = flash
    ascent.fa = False
    ascent.soft = soft
    ascent.hard = hard
    ascent.with_kneepad = False
    ascent.rating = rating
    ascent.date = date
    ascent.year = year
    ascent.ascent_date = date or datetime.date(year, 1, 1)
    db.session.add(ascent)
    return ascent


def test_line_statistics(client, member_token):
    admin = User.find_by_email("admin@localcrag.invalid.org")
    member = User.find_by_email("member@localcrag.invalid.org")
    line = _add_line("Stats Heat", 10, fa_year=2019)
    _add_ascent(
        line,
        admin.id,
        grade=11,
        flash=True,
        soft=True,
        rating=4,
        date=datetime.date(2024, 7, 15),
    )
    _add_ascent(line, member.id, grade=10, hard=True, rating=5, year=2023)
    db.session.commit()

    rv = client.get(f"/api/statistics/topo/line/{line.slug}")
    assert rv.status_code == 200
    body = rv.json
    assert body["objectType"] == "line"
    assert body["firstAscentsPerYear"] is None
    assert body["firstAscentsUndated"] is None
    assert body["children"] is None
    assert body["childKind"] is None
    assert body["disciplines"] is None
    assert body["popularLines"] is None
    assert body["myCompletion"] is None
    assert body["coverage"] == {
        "totalLines": 1,
        "projects": 0,
        "distinctClimbers": None,
        "totalAscents": 2,
    }
    assert body["flash"] == {"count": 1, "percent": 50}
    assert body["consensus"]["softCount"] == 1
    assert body["consensus"]["hardCount"] == 1
    assert body["consensus"]["softPercent"] == 50
    assert body["consensus"]["hardPercent"] == 50
    assert body["ratings"]["average"] == 4.5
    assert body["ratings"]["count"] == 2
    assert body["ratings"]["distribution"]["4"] == 1
    assert body["ratings"]["distribution"]["5"] == 1
    # 15 July 2024 is a Monday in ISO week 29. The year-only ascent is excluded.
    assert body["heatmap"] == {"29-1": 1}
    assert body["ascentsPerYear"]["2024"] == 1
    assert body["ascentsPerYear"]["2023"] == 1
    assert body["gradeVotes"]["votes"] == {"11": 1, "10": 1}
    assert body["gradeVotes"]["authorGradeValue"] == 10
    assert body["wishlist"]["todoCount"] == 0
    assert "comments" in body["social"]
    assert "galleryImages" in body["social"]

    authed = client.get(f"/api/statistics/topo/line/{line.slug}", token=member_token)
    assert authed.status_code == 200
    assert authed.json["myCompletion"] is None


def test_area_statistics_include_first_ascents_and_wishlist(client):
    member = User.find_by_email("member@localcrag.invalid.org")
    other = User.find_by_email("user@localcrag.invalid.org")
    climbed = _add_line("Stats Heat", 10, fa_year=2019)
    _add_line("Stats Project", -1)
    _add_ascent(climbed, member.id, grade=10, date=datetime.date(2024, 7, 15))
    wanted = _add_line("Stats Wanted", 12)
    for user in (member, other):
        todo = Todo()
        todo.line_id = wanted.id
        todo.created_by_id = user.id
        todo.priority = TodoPriorityEnum.MEDIUM
        db.session.add(todo)
    # One open todo on a line that already has an ascent. It still belongs on the list.
    climbed_todo = Todo()
    climbed_todo.line_id = climbed.id
    climbed_todo.created_by_id = other.id
    climbed_todo.priority = TodoPriorityEnum.MEDIUM
    db.session.add(climbed_todo)
    db.session.commit()

    area = Area.find_by_slug("shark-attack")
    rv = client.get(f"/api/statistics/topo/area/{area.slug}")
    assert rv.status_code == 200
    body = rv.json
    assert body["objectType"] == "area"
    assert body["children"] is None
    assert body["firstAscentsPerYear"]["2019"] >= 1
    undated = (
        SecretService.apply_line_filter(db.session.query(Line))
        .filter(
            Line.area_id == area.id,
            Line.archived.is_(False),
            Line.author_grade_value >= 0,
            Line.fa_year.is_(None),
            Line.fa_date.is_(None),
        )
        .count()
    )
    assert body["firstAscentsUndated"] == undated
    assert undated >= 1
    assert body["heatmap"]["29-1"] >= 1
    assert body["disciplines"]["BOULDER"] >= 1
    graded_lines = (
        SecretService.apply_line_filter(db.session.query(Line))
        .filter(Line.area_id == area.id, Line.archived.is_(False), Line.author_grade_value >= 0)
        .count()
    )
    project_lines = (
        SecretService.apply_line_filter(db.session.query(Line))
        .filter(Line.area_id == area.id, Line.archived.is_(False), Line.author_grade_value < 0)
        .count()
    )
    assert body["coverage"]["totalLines"] == graded_lines
    assert body["coverage"]["projects"] == project_lines
    assert project_lines >= 1
    assert body["wishlist"]["todoCount"] >= 2
    wanted_lines = body["wishlist"]["wantedLines"]
    wanted_names = [line["name"] for line in wanted_lines]
    assert wanted_names.index("Stats Wanted") < wanted_names.index("Stats Heat")
    heat = next(line for line in wanted_lines if line["name"] == "Stats Heat")
    assert heat["todoCount"] == 1
    assert heat["ascentCount"] >= heat["todoCount"]
    todo_counts = [line["todoCount"] for line in wanted_lines]
    assert todo_counts == sorted(todo_counts, reverse=True)
    popular_names = [line["name"] for line in body["popularLines"]]
    assert "Stats Heat" in popular_names


def test_crag_and_region_child_pies(client):
    area = Area.find_by_slug("shark-attack")
    crag_slug = area.sector.crag.slug

    crag = client.get(f"/api/statistics/topo/crag/{crag_slug}")
    assert crag.status_code == 200
    assert crag.json["childKind"] == "sector"
    assert crag.json["children"]
    assert sum(child["lineCount"] for child in crag.json["children"]) == crag.json["coverage"]["totalLines"]

    region = client.get("/api/statistics/topo/region")
    assert region.status_code == 200
    assert region.json["childKind"] == "crag"
    assert region.json["children"]
    assert region.json["gradeVotes"] is None


def test_secret_line_is_hidden(client, moderator_token):
    line = _add_line("Stats Secret", 8)
    line.secret = True
    db.session.commit()

    hidden = client.get(f"/api/statistics/topo/line/{line.slug}")
    assert hidden.status_code == 404

    visible = client.get(f"/api/statistics/topo/line/{line.slug}", token=moderator_token)
    assert visible.status_code == 200
    assert visible.json["coverage"]["totalLines"] == 1


def test_unknown_topo_statistics_target(client):
    assert client.get("/api/statistics/topo/nope").status_code == 404
    assert client.get("/api/statistics/topo/crag/missing-crag").status_code == 404
    assert client.get("/api/statistics/topo/region/brione").status_code == 404


def _add_comment(object_type, object_id, user_id, *, deleted=False):
    comment = Comment()
    comment.message = None if deleted else "Stats comment"
    comment.object_type = object_type
    comment.object_id = object_id
    comment.created_by_id = None if deleted else user_id
    comment.is_deleted = deleted
    db.session.add(comment)
    return comment


def _comment_total(client, path, token=None):
    rv = client.get(path, token=token) if token else client.get(path)
    assert rv.status_code == 200
    return rv.json["social"]["comments"]


def test_comment_count_includes_child_items(client, moderator_token):
    user = User.find_by_email("member@localcrag.invalid.org")
    area = Area.find_by_slug("shark-attack")
    sector = area.sector
    crag = sector.crag
    line = _add_line("Stats Commented", 10)
    secret_line = _add_line("Stats Secret Comment", 8)
    secret_line.secret = True
    db.session.flush()

    paths = {
        "line": f"/api/statistics/topo/line/{line.slug}",
        "area": f"/api/statistics/topo/area/{area.slug}",
        "sector": f"/api/statistics/topo/sector/{sector.slug}",
        "crag": f"/api/statistics/topo/crag/{crag.slug}",
        "region": "/api/statistics/topo/region",
    }
    before = {name: _comment_total(client, path) for name, path in paths.items()}
    before_secret = _comment_total(client, paths["area"], token=moderator_token)

    _add_comment("Area", area.id, user.id)
    _add_comment("Line", line.id, user.id)
    _add_comment("Line", line.id, user.id, deleted=True)
    _add_comment("Sector", sector.id, user.id)
    _add_comment("Line", secret_line.id, user.id)
    db.session.commit()

    # The area comment and the visible line comment. The sector comment sits above the area,
    # and the deleted comment and the secret line stay out.
    assert _comment_total(client, paths["line"]) == 1
    assert _comment_total(client, paths["area"]) == before["area"] + 2
    assert _comment_total(client, paths["sector"]) == before["sector"] + 3
    assert _comment_total(client, paths["crag"]) == before["crag"] + 3
    assert _comment_total(client, paths["region"]) == before["region"] + 3
    assert _comment_total(client, paths["area"], token=moderator_token) == before_secret + 3


def test_gym_mode_omits_first_ascents(client):
    settings = InstanceSettings.return_it()
    settings.gym_mode = True
    db.session.add(settings)
    db.session.commit()

    area = Area.find_by_slug("shark-attack")
    rv = client.get(f"/api/statistics/topo/area/{area.slug}")
    assert rv.status_code == 200
    assert rv.json["firstAscentsPerYear"] is None
    assert rv.json["firstAscentsUndated"] is None
