from extensions import db
from models.line import Line


def test_successful_get_region(client):
    rv = client.get("/api/region")
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == "d2c864b4-ca80-4d01-a8bf-41521182b5d4"
    assert res["name"] == "Tessin"
    assert res["description"] == "Tolle Region"
    assert res["rules"] is None
    assert res["ascentCount"] == 1


def test_successful_edit_region(client, admin_token):
    crag_data = {"description": "Fodere et scandere. 2", "rules": "test rules", "name": "Nahetal"}

    rv = client.put("/api/region", token=admin_token, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == "d2c864b4-ca80-4d01-a8bf-41521182b5d4"
    assert res["name"] == "Nahetal"
    assert res["description"] == "Fodere et scandere. 2"
    assert res["rules"] == "test rules"
    assert res["ascentCount"] == 1


def test_successful_get_region_grades(client):
    rv = client.get("/api/region/grades")
    assert rv.status_code == 200
    res = rv.json
    assert res["BOULDER"]["FB"] == {"1": 1, "22": 1}


def test_region_grades_exclude_closed_lines(client):
    line = Line.query.filter(Line.archived.is_(False), Line.closed.is_(False)).first()
    assert line is not None
    original_grade_value = str(line.author_grade_value)
    original_scale = line.grade_scale
    original_type = line.type.value

    baseline_rv = client.get("/api/region/grades?exclude_closed=1")
    assert baseline_rv.status_code == 200
    baseline = baseline_rv.json
    baseline_count = baseline[original_type][original_scale].get(original_grade_value, 0)
    assert baseline_count > 0

    line.closed = True
    line.closed_reason = "Temporarily closed"
    db.session.add(line)
    db.session.commit()

    rv = client.get("/api/region/grades?exclude_closed=1")
    assert rv.status_code == 200
    res = rv.json
    grade_counts = res[original_type][original_scale]
    assert grade_counts.get(original_grade_value, 0) == baseline_count - 1
