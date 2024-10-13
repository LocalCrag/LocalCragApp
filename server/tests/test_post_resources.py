def test_successful_create_post(client, moderator_token):
    post_data = {
        "title": "Glees ist gesperrt!",
        "text": "<p>Haha, verarscht!</p>",
    }

    rv = client.post('/api/posts', token=moderator_token, json=post_data)
    assert rv.status_code == 201
    res = rv.json
    assert res['title'] == "Glees ist gesperrt!"
    assert res['slug'] == "glees-ist-gesperrt"
    assert res['text'] == "<p>Haha, verarscht!</p>"
    assert res['id'] is not None


def test_successful_get_posts(client):
    rv = client.get('/api/posts')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert isinstance(res[0]['id'], str)
    assert res[0]['slug'] == "noch-ein-post"
    assert res[0]['title'] == "Noch ein Post"
    assert res[0]['text'] == "<p>Was steht hier nur für ein Quatsch?</p>"
    assert isinstance(res[1]['id'], str)
    assert res[1]['slug'] == "mein-erster-post"
    assert res[1]['title'] == "Mein erster Post"
    assert res[1]['text'] == "<p>Juhu, sie haben Post!</p>"


def test_successful_get_post(client):
    rv = client.get('/api/posts/noch-ein-post')
    assert rv.status_code == 200
    res = rv.json
    assert isinstance(res['id'], str)
    assert res['slug'] == "noch-ein-post"
    assert res['title'] == "Noch ein Post"
    assert res['text'] == "<p>Was steht hier nur für ein Quatsch?</p>"


def test_get_deleted_post(client):
    rv = client.get('/api/posts/hohenfels')
    assert rv.status_code == 404
    res = rv.json
    assert res['message'] == "ENTITY_NOT_FOUND"


def test_successful_delete_post(client, moderator_token):
    rv = client.delete('/api/posts/noch-ein-post', token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_post(client, moderator_token):
    post_data = {
        "title": "Alles außer Eifel",
        "text": "ist soft bewertet",
    }

    rv = client.put('/api/posts/mein-erster-post', token=moderator_token, json=post_data)
    assert rv.status_code == 200
    res = rv.json
    assert res['slug'] == "alles-ausser-eifel"
    assert res['title'] == "Alles außer Eifel"
    assert res['text'] == "ist soft bewertet"
    assert res['id'] is not None

