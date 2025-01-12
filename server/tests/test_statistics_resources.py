from models.ascent import Ascent
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
