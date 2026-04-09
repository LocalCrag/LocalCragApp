from extensions import db
from models.area import Area
from models.ascent import Ascent
from models.line import Line
from models.user import User


def test_successful_get_completion(client):
    admin_id = User.find_by_email("admin@localcrag.invalid.org").id
    ascent = Ascent.query.filter(Ascent.created_by_id == admin_id).all()[0]

    rv = client.get(f"/api/statistics/completion?min_grade=0&max_grade=28&user_id={admin_id}")
    assert rv.status_code == 200
    res = rv.json
    assert res["areas"][str(ascent.area_id)]["ascents"] == 1
    assert res["areas"][str(ascent.area_id)]["totalLines"] == 2
    assert res["sectors"][str(ascent.sector_id)]["ascents"] == 1
    assert res["sectors"][str(ascent.sector_id)]["totalLines"] == 2
    assert res["crags"][str(ascent.crag_id)]["ascents"] == 1
    assert res["crags"][str(ascent.crag_id)]["totalLines"] == 2


def test_successful_get_empty_grade_filtered_completion(client):
    admin_id = User.find_by_email("admin@localcrag.invalid.org").id

    rv = client.get(f"/api/statistics/completion?min_grade=28&max_grade=28&user_id={admin_id}")
    assert rv.status_code == 200
    res = rv.json
    assert not res["areas"]
    assert not res["sectors"]
    assert not res["crags"]


def test_successful_get_empty_user_filtered_completion(client):
    member_id = User.find_by_email("member@localcrag.invalid.org").id

    rv = client.get(f"/api/statistics/completion?min_grade=28&max_grade=28&user_id={member_id}")
    assert rv.status_code == 200
    res = rv.json
    assert not res["areas"]
    assert not res["sectors"]
    assert not res["crags"]


def test_completion_excludes_closed_lines_by_default(client):
    admin_id = User.find_by_email("admin@localcrag.invalid.org").id
    ascent = Ascent.query.filter(Ascent.created_by_id == admin_id).first()
    assert ascent is not None

    line = Line.find_by_id(ascent.line_id)
    line.closed = True
    line.closed_reason = "Temporarily closed"
    db.session.add(line)
    db.session.commit()

    rv = client.get(f"/api/statistics/completion?min_grade=0&max_grade=28&user_id={admin_id}")
    assert rv.status_code == 200
    res = rv.json
    assert res["areas"][str(ascent.area_id)]["ascents"] == 0
    assert res["areas"][str(ascent.area_id)]["totalLines"] == 1
    assert res["sectors"][str(ascent.sector_id)]["ascents"] == 0
    assert res["sectors"][str(ascent.sector_id)]["totalLines"] == 1
    assert res["crags"][str(ascent.crag_id)]["ascents"] == 0
    assert res["crags"][str(ascent.crag_id)]["totalLines"] == 1


def test_completion_can_include_closed_lines(client):
    admin_id = User.find_by_email("admin@localcrag.invalid.org").id
    ascent = Ascent.query.filter(Ascent.created_by_id == admin_id).first()
    assert ascent is not None

    line = Line.find_by_id(ascent.line_id)
    line.closed = True
    line.closed_reason = "Temporarily closed"
    db.session.add(line)
    db.session.commit()

    rv = client.get(f"/api/statistics/completion?min_grade=0&max_grade=28&include_closed=1&user_id={admin_id}")
    assert rv.status_code == 200
    res = rv.json
    assert res["areas"][str(ascent.area_id)]["ascents"] == 1
    assert res["areas"][str(ascent.area_id)]["totalLines"] == 2
    assert res["sectors"][str(ascent.sector_id)]["ascents"] == 1
    assert res["sectors"][str(ascent.sector_id)]["totalLines"] == 2
    assert res["crags"][str(ascent.crag_id)]["ascents"] == 1
    assert res["crags"][str(ascent.crag_id)]["totalLines"] == 2


def test_completion_excludes_closed_parent_spots_by_default(client):
    admin_id = User.find_by_email("admin@localcrag.invalid.org").id
    ascent = Ascent.query.filter(Ascent.created_by_id == admin_id).first()
    assert ascent is not None

    area = Area.find_by_id(ascent.area_id)
    area.closed = True
    area.closed_reason = "Temporarily closed area"
    db.session.add(area)
    db.session.commit()

    rv = client.get(f"/api/statistics/completion?min_grade=0&max_grade=28&user_id={admin_id}")
    assert rv.status_code == 200
    res = rv.json
    assert str(ascent.area_id) not in res["areas"]
    assert str(ascent.sector_id) not in res["sectors"]
    assert str(ascent.crag_id) not in res["crags"]
