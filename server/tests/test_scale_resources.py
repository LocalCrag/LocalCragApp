from models.enums.line_type_enum import LineTypeEnum
from models.scale import GRADE_BRACKETS, GRADES


def test_successful_get_scales(client):
    rv = client.get("/api/scales")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert {(LineTypeEnum.BOULDER.value, "FB"), (LineTypeEnum.SPORT.value, "UIAA")} == {
        (r["type"], r["name"]) for r in res
    }


def test_successful_get_scale(client):
    rv = client.get("/api/scales/BOULDER/FB")
    assert rv.status_code == 200
    res = rv.json
    assert res["type"] == LineTypeEnum.BOULDER.value
    assert res["name"] == "FB"
    assert res["grades"] == GRADES[LineTypeEnum.BOULDER]["FB"]
    assert res["gradeBrackets"] == GRADE_BRACKETS[LineTypeEnum.BOULDER]["FB"]


def test_successful_create_scale(client, admin_token):
    scale_data = {
        "type": "TRAD",
        "name": "Best Scale",
        "grades": [
            {"name": "easy", "value": 1},
            {"name": "normal", "value": 2},
            {"name": "hard", "value": 3},
            {"name": "insane", "value": 4},
        ],
        "gradeBrackets": {
            "barChartBrackets": [
                {"name": "easy", "value": 1},
                {"name": "hard", "value": 3},
                {"name": "insane", "value": 4},
            ],
            "stackedChartBrackets": [1, 3, 4],
        },
    }

    rv = client.post("/api/scales", token=admin_token, json=scale_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["type"] == scale_data["type"]
    assert res["name"] == scale_data["name"]
    assert res["grades"] == scale_data["grades"]
    assert res["gradeBrackets"] == scale_data["gradeBrackets"]


def test_successful_update_scale(client, admin_token):
    scale_data = {
        "type": "BOULDER",
        "name": "FBnew",
        "grades": [{"name": f"g{val}", "value": val} for val in range(28)],
        "gradeBrackets": GRADE_BRACKETS[LineTypeEnum.BOULDER]["FB"],
    }

    rv = client.put("/api/scales/BOULDER/FB", token=admin_token, json=scale_data)
    assert rv.status_code == 200

    rv = client.get("/api/lines/treppe")
    assert rv.status_code == 200
    res = rv.json
    assert res["gradeScale"] == "FBnew"


def test_unsuccessful_update_scale_changed_type(client, admin_token):
    scale_data = {
        "type": "TRAD",
        "name": "FB",
        "grades": GRADES[LineTypeEnum.BOULDER]["FB"],
        "gradeBrackets": GRADE_BRACKETS[LineTypeEnum.BOULDER]["FB"],
    }

    rv = client.put("/api/scales/BOULDER/FB", token=admin_token, json=scale_data)
    assert rv.status_code == 409


def test_unsuccessful_update_scale_missing_values(client, admin_token):
    grades_data = {
        "type": "BOULDER",
        "name": "FB",
        "grades": [{"name": "idontcare", "value": 42}],
        "gradeBrackets": GRADE_BRACKETS[LineTypeEnum.BOULDER]["FB"],
    }

    rv = client.put("/api/scales/BOULDER/FB", token=admin_token, json=grades_data)
    assert rv.status_code == 409


def test_successful_delete_scale(client, admin_token):
    rv = client.delete("/api/scales/SPORT/UIAA", token=admin_token)
    assert rv.status_code == 204


def test_unsuccessful_delete_scale(client, admin_token):
    rv = client.delete("/api/scales/BOULDER/FB", token=admin_token)
    assert rv.status_code == 409
