def test_successful_get_region(client):
    rv = client.get('/api/region')
    assert rv.status_code == 200
    res = rv.json
    assert res['id'] == "d2c864b4-ca80-4d01-a8bf-41521182b5d4"
    assert res['name'] == "Tessin"
    assert res['description'] == "Tolle Region"
    assert res['rules'] == None
    assert res['ascentCount'] == 1


def test_successful_edit_region(client, admin_token):
    crag_data = {
        "description": "Fodere et scandere. 2",
        "rules": "test rules",
        "name": "Nahetal"
    }

    rv = client.put('/api/region', headers={"Authorization": f"Bearer {admin_token}"}, json=crag_data)
    assert rv.status_code == 200
    res = rv.json
    assert res['id'] == "d2c864b4-ca80-4d01-a8bf-41521182b5d4"
    assert res['name'] == "Nahetal"
    assert res['description'] == "Fodere et scandere. 2"
    assert res['rules'] == "test rules"
    assert res['ascentCount'] == 1


def test_successful_get_region_grades(client):
    rv = client.get('/api/region/grades')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert res[1]['gradeName'] == "1"
    assert res[1]['gradeScale'] == "FB"
    assert res[0]['gradeName'] == "8A"
    assert res[0]['gradeScale'] == "FB"
