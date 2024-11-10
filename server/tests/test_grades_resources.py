from models.enums.line_type_enum import LineTypeEnum
from models.grades import GRADES


def test_successful_get_grades_list(client):
    rv = client.get("/api/grades")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert {(LineTypeEnum.BOULDER.value, "FB"), (LineTypeEnum.SPORT.value, "UIAA")} == {
        (r["type"], r["name"]) for r in res
    }


def test_successful_get_grades(client):
    rv = client.get("/api/grades/BOULDER/FB")
    assert rv.status_code == 200
    res = rv.json
    assert res["type"] == LineTypeEnum.BOULDER.value
    assert res["name"] == "FB"
    assert res["grades"] == GRADES[LineTypeEnum.BOULDER]["FB"]


def test_successful_create_grades(client, admin_token):
    grades_data = {
        "type": "TRAD",
        "name": "Best Scale",
        "grades": [
            {"name": "easy", "value": 0},
            {"name": "normal", "value": 13},
            {"name": "hard", "value": 42},
        ]
    }

    rv = client.post("/api/grades", token=admin_token, json=grades_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["type"] == grades_data["type"]
    assert res["name"] == grades_data["name"]
    assert res["grades"] == grades_data["grades"]


def test_successful_update_grades(client, admin_token):
    grades_data = {
        "type": "BOULDER",
        "name": "FBnew",
        "grades": [
            {"name": f"g{val}", "value": val} for val in range(28)
        ]
    }

    rv = client.put(f"/api/grades/BOULDER/FB", token=admin_token, json=grades_data)
    assert rv.status_code == 200

    rv = client.get(f"/api/lines/treppe")
    assert rv.status_code == 200
    res = rv.json
    assert res["gradeName"] == "g1"
    assert res["gradeScale"] == "FBnew"


def test_unsuccessful_update_grades_changed_type(client, admin_token):
    grades_data = {
        "type": "TRAD",
        "name": "FB",
        "grades": GRADES[LineTypeEnum.BOULDER]["FB"]
    }

    rv = client.put(f"/api/grades/BOULDER/FB", token=admin_token, json=grades_data)
    assert rv.status_code == 409


def test_unsuccessful_update_grades_missing_values(client, admin_token):
    grades_data = {
        "type": "BOULDER",
        "name": "FB",
        "grades": [
            {"name": "idontcare", "value": 42}
        ]
    }

    rv = client.put(f"/api/grades/BOULDER/FB", token=admin_token, json=grades_data)
    assert rv.status_code == 409


def test_successful_delete_grades(client, admin_token):
    rv = client.delete(f"/api/grades/SPORT/UIAA", token=admin_token)
    assert rv.status_code == 204



def test_unsuccessful_delete_grades(client, admin_token):
    rv = client.delete(f"/api/grades/BOULDER/FB", token=admin_token)
    assert rv.status_code == 409
