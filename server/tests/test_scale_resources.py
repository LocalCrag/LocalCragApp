from models.enums.line_type_enum import LineTypeEnum
from models.scale import DEFAULT_SCALE_NAMES, GRADE_BRACKETS, GRADES


def test_successful_get_scales(client):
    rv = client.get("/api/scales")
    assert rv.status_code == 200
    res = rv.json
    assert {(r["type"], r["name"]) for r in res} == {
        (line_type.value, name) for line_type, scales in GRADES.items() for name in scales
    }
    assert {(r["type"], r["name"]) for r in res if r["isDefault"]} == {
        (line_type.value, name) for line_type, name in DEFAULT_SCALE_NAMES.items()
    }


def test_builtin_scale_brackets_reference_existing_grades():
    for line_type, scales in GRADE_BRACKETS.items():
        for name, brackets in scales.items():
            values = {grade["value"] for grade in GRADES[line_type][name]}
            for bracket in brackets["barChartBrackets"] + brackets["stackedChartBrackets"]:
                assert bracket["value"] in values, (name, bracket)


def test_successful_get_scale(client):
    rv = client.get("/api/scales/BOULDER/FB")
    assert rv.status_code == 200
    res = rv.json
    assert res["type"] == LineTypeEnum.BOULDER.value
    assert res["name"] == "FB"
    assert res["isDefault"] is True
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
            "stackedChartBrackets": [
                {"value": 1, "color": "#eab308"},
                {"value": 3, "color": "#3b82f6"},
                {"value": 4, "color": "#ef4444"},
            ],
        },
    }

    rv = client.post("/api/scales", token=admin_token, json=scale_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["type"] == scale_data["type"]
    assert res["name"] == scale_data["name"]
    assert res["isDefault"] is False
    assert res["grades"] == scale_data["grades"]
    assert res["gradeBrackets"] == {
        **scale_data["gradeBrackets"],
        "showDiagrams": True,
    }


def test_scale_can_hide_diagrams(client, admin_token):
    scale_data = {
        "type": "SPORT",
        "name": "UIAA",
        "grades": GRADES[LineTypeEnum.SPORT]["UIAA"],
        "gradeBrackets": {
            **GRADE_BRACKETS[LineTypeEnum.SPORT]["UIAA"],
            "showDiagrams": False,
        },
    }

    rv = client.put("/api/scales/SPORT/UIAA", token=admin_token, json=scale_data)
    assert rv.status_code == 200
    assert rv.json["gradeBrackets"]["showDiagrams"] is False

    rv = client.get("/api/scales/SPORT/UIAA")
    assert rv.status_code == 200
    assert rv.json["gradeBrackets"]["showDiagrams"] is False


def test_successful_update_scale(client, admin_token):
    scale_data = {
        "type": "BOULDER",
        "name": "FBnew",
        "grades": [{"name": f"g{val}", "value": val} for val in range(28)],
        "gradeBrackets": GRADE_BRACKETS[LineTypeEnum.BOULDER]["FB"],
    }

    rv = client.put("/api/scales/BOULDER/FB", token=admin_token, json=scale_data)
    assert rv.status_code == 200

    rv = client.get("/api/lines/the-vessel")
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


def test_set_default_scale(client, admin_token):
    rv = client.put("/api/scales/SPORT/UIAA/default", token=admin_token)
    assert rv.status_code == 200
    assert rv.json["isDefault"] is True

    rv = client.get("/api/scales")
    defaults = {(row["type"], row["name"]) for row in rv.json if row["isDefault"]}
    assert ("SPORT", "UIAA") in defaults
    assert ("SPORT", "French") not in defaults
    assert ("BOULDER", "FB") in defaults


def test_cannot_delete_default_scale(client, admin_token):
    rv = client.delete("/api/scales/SPORT/French", token=admin_token)
    assert rv.status_code == 409


def test_cannot_change_type_of_default_scale(client, admin_token):
    scale_data = {
        "type": "SPORT",
        "name": "British",
        "grades": GRADES[LineTypeEnum.TRAD]["British"],
        "gradeBrackets": GRADE_BRACKETS[LineTypeEnum.TRAD]["British"],
    }
    rv = client.put("/api/scales/TRAD/British", token=admin_token, json=scale_data)
    assert rv.status_code == 409
