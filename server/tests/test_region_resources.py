def test_successful_get_region(client):
    rv = client.get("/api/region")
    assert rv.status_code == 200
    res = rv.json
    assert res["id"] == "d2c864b4-ca80-4d01-a8bf-41521182b5d4"
    assert res["name"] == "Tessin"
    assert res["description"] == "Tolle Region"
    assert res["rules"] == None
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
