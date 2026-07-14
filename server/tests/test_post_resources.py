from models.comment import Comment
from models.post import Post


def test_successful_create_post(client, moderator_token):
    post_data = {
        "title": "Glees is closed!",
        "text": "<p>Haha, fooled you!</p>",
    }

    rv = client.post("/api/posts", token=moderator_token, json=post_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["title"] == "Glees is closed!"
    assert res["slug"] == "glees-is-closed"
    assert res["text"] == "<p>Haha, fooled you!</p>"
    assert res["id"] is not None
    assert res["commentCount"] == 0


def test_create_post_strips_inline_colors(client, moderator_token):
    post_data = {
        "title": "Color test post",
        "text": '<p><span style="color: rgb(230, 0, 0);">Red text</span></p>',
    }

    rv = client.post("/api/posts", token=moderator_token, json=post_data)
    assert rv.status_code == 201
    assert rv.json["text"] == "<p><span>Red text</span></p>"

    stored = Post.find_by_id(rv.json["id"])
    assert stored.text == "<p><span>Red text</span></p>"


def test_successful_get_posts(client):
    posts = Post.query.all()

    rv = client.get("/api/posts")
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == len(posts)
    for r, p in zip(sorted(res, key=lambda r: r["id"]), sorted(posts, key=lambda p: str(p.id))):
        assert r["id"] == str(p.id)
        assert r["slug"] == p.slug
        assert r["title"] == p.title
        assert r["text"] == p.text
        assert (
            r["commentCount"] == Comment.query.filter_by(object_type="Post", object_id=p.id, is_deleted=False).count()
        )


def test_successful_get_post(client):
    rv = client.get("/api/posts/new-boulders-in-brione")
    assert rv.status_code == 200
    res = rv.json
    assert isinstance(res["id"], str)
    assert res["slug"] == "new-boulders-in-brione"
    assert res["title"] == "New boulders in Brione!"
    assert res["text"] == "<p>Felix and Fabian developed some cool new lines in Upper Brione, go check them out!</p>"
    post_row = Post.find_by_slug("new-boulders-in-brione")
    assert (
        res["commentCount"]
        == Comment.query.filter_by(object_type="Post", object_id=post_row.id, is_deleted=False).count()
    )


def test_get_deleted_post(client):
    rv = client.get("/api/posts/hohenfels")
    assert rv.status_code == 404
    res = rv.json
    assert res["message"] == "ENTITY_NOT_FOUND"


def test_successful_delete_post(client, moderator_token):
    rv = client.delete("/api/posts/new-boulders-in-brione", token=moderator_token)
    assert rv.status_code == 204


def test_successful_edit_post(client, moderator_token):
    post_data = {
        "title": "Everything except Eifel",
        "text": "is soft graded",
    }

    rv = client.put("/api/posts/my-first-post", token=moderator_token, json=post_data)
    assert rv.status_code == 200
    res = rv.json
    assert res["slug"] == "everything-except-eifel"
    assert res["title"] == "Everything except Eifel"
    assert res["text"] == "is soft graded"
    assert res["id"] is not None
