def test_successful_search(client):
    rv = client.get('/api/search/superspread')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 10
    assert res[0]['type'] == "LINE"
    assert res[0]['item']['name'] == "Super-Spreader"
