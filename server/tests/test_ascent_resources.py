from extensions import db
from models.ascent import Ascent
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.line import Line
from models.user import User
from util.voting import update_grades_and_rating


def test_successful_create_ascent(client, member_token):
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 11,
        "line": str(Line.get_id_by_slug("treppe")),
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=member_token, json=ascent_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["flash"] is True
    assert res["fa"] is False
    assert res["soft"] is True
    assert res["hard"] is False
    assert res["withKneepad"] is True
    assert res["rating"] == 2
    assert res["comment"] == "Hahahahaha"
    assert res["year"] is None
    assert res["gradeValue"] == 11
    assert res["date"] == "2024-04-13"
    assert res["line"]["slug"] == "treppe"
    assert res["area"]["slug"] == "dritter-block-von-links"
    assert res["sector"]["slug"] == "schattental"
    assert res["crag"]["slug"] == "brione"

    # Check updated ascent counts
    rv = client.get("/api/lines/treppe")
    assert rv.status_code == 200
    res = rv.json
    assert res["ascentCount"] == 1

    rv = client.get("/api/areas/dritter-block-von-links")
    assert rv.status_code == 200
    res = rv.json
    assert res["ascentCount"] == 2

    rv = client.get("/api/sectors/schattental")
    assert rv.status_code == 200
    res = rv.json
    assert res["ascentCount"] == 2

    rv = client.get("/api/crags/brione")
    assert rv.status_code == 200
    res = rv.json
    assert res["ascentCount"] == 2

    rv = client.get("/api/region")
    assert rv.status_code == 200
    res = rv.json
    assert res["ascentCount"] == 2


def test_successful_update_ascent(client, admin_token):
    ascent = Ascent.query.first()

    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 11,
        "line": str(Line.get_id_by_slug("super-spreader")),
        "date": "2024-04-13",
    }

    rv = client.put(f"/api/ascents/{ascent.id}", token=admin_token, json=ascent_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["flash"] is True
    assert res["fa"] is False
    assert res["soft"] is True
    assert res["hard"] is False
    assert res["withKneepad"] is True
    assert res["rating"] == 2
    assert res["comment"] == "Hahahahaha"
    assert res["year"] is None
    assert res["gradeValue"] == 11
    assert res["date"] == "2024-04-13"
    assert res["line"]["slug"] == "super-spreader"
    assert res["area"]["slug"] == "dritter-block-von-links"
    assert res["sector"]["slug"] == "schattental"
    assert res["crag"]["slug"] == "brione"


def test_log_twice(client, admin_token):
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 11,
        "line": str(Line.get_id_by_slug("super-spreader")),
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=admin_token, json=ascent_data)
    assert rv.status_code == 400


def test_create_ascent_non_existing_line(client, member_token):
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 11,
        "line": "8d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=member_token, json=ascent_data)
    assert rv.status_code == 404


def test_successful_get_ascents(client):
    ascent = Ascent.query.first()

    rv = client.get("/api/ascents?page=1")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1
    assert res["items"][0]["id"] == str(ascent.id)
    assert res["items"][0]["flash"] is False
    assert res["items"][0]["fa"] is True
    assert res["items"][0]["soft"] is False
    assert res["items"][0]["hard"] is True
    assert res["items"][0]["withKneepad"] is True
    assert res["items"][0]["rating"] == 3
    assert res["items"][0]["comment"] == "Yeeha!"
    assert res["items"][0]["year"] is None
    assert res["items"][0]["gradeValue"] == 22
    assert res["items"][0]["date"] == "2024-04-16"
    assert res["items"][0]["line"]["slug"] == "super-spreader"
    assert res["items"][0]["area"]["slug"] == "dritter-block-von-links"
    assert res["items"][0]["sector"]["slug"] == "schattental"
    assert res["items"][0]["crag"]["slug"] == "brione"
    assert res["hasNext"] is False

    rv = client.get(f'/api/ascents?crag_id={Crag.find_by_slug("chironico").id}&page=1')
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 0

    rv = client.get(f'/api/ascents?crag_id={Crag.find_by_slug("brione").id}&page=1')
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 1

    rv = client.get("/api/ascents?page=2")
    assert rv.status_code == 404


def test_successful_get_ticks(client):
    admin = User.find_by_email("admin@localcrag.invalid.org")
    member = User.find_by_email("member@localcrag.invalid.org")
    ascent = Ascent.query.first()
    rv = client.get(f'/api/ticks?user_id={admin.id}&crag_id={Crag.find_by_slug("brione").id}')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 1
    assert res[0] == str(ascent.line_id)

    rv = client.get(f'/api/ticks?user_id={member.id}&crag_id={Crag.find_by_slug("brione").id}')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 0


def test_successful_delete_ascent(client, admin_token):
    ascent = Ascent.query.first()
    rv = client.delete(f"/api/ascents/{ascent.id}", token=admin_token)
    assert rv.status_code == 204

    # Line must be still there
    rv = client.get("/api/lines/super-spreader")
    assert rv.status_code == 200


def test_delete_user_deletes_tick_but_not_line(client):
    admin = User.find_by_email("admin@localcrag.invalid.org")
    db.session.delete(admin)

    # Tick is gone
    rv = client.get("/api/ascents?page=1")
    assert rv.status_code == 200
    res = rv.json
    assert len(res["items"]) == 0

    # Line must be still there
    rv = client.get("/api/lines/super-spreader")
    assert rv.status_code == 200


def test_send_project_climbed_message(client, mocker, moderator_token, user_token):
    # Create a project line first
    line_data = {
        "name": "Es",
        "description": "Super Boulder",
        "videos": [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        "authorGradeValue": -1,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "FRENCH",
        "eliminate": True,
        "traverse": True,
        "highball": True,
        "morpho": True,
        "lowball": True,
        "noTopout": True,
        "badDropzone": True,
        "childFriendly": True,
        "roof": True,
        "slab": True,
        "vertical": True,
        "overhang": True,
        "athletic": True,
        "technical": True,
        "endurance": True,
        "cruxy": True,
        "dyno": True,
        "jugs": True,
        "sloper": True,
        "crimps": True,
        "pockets": True,
        "pinches": True,
        "crack": True,
        "dihedral": True,
        "compression": True,
        "arete": True,
        "mantle": True,
        "secret": False,
        "closed": False,
        "closedReason": None,
    }

    rv = client.post("/api/areas/dritter-block-von-links/lines", token=moderator_token, json=line_data)
    assert rv.status_code == 201
    res = rv.json
    line_id = res["id"]

    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)
    project_climbed_data = {
        "line": line_id,
        "message": "I climbed the project! I think it's a 9A+ boulder. Cheers, Aidan Roberts",
    }
    rv = client.post("/api/ascents/send-project-climbed-message", token=user_token, json=project_climbed_data)
    assert rv.status_code == 204

    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1

    treppe = str(Line.get_id_by_slug("treppe"))

    # Try sending a project climbed message for a line that is not a project
    project_climbed_data = {
        "line": treppe,
        "message": "I climbed the project! I think it's a 9A+ boulder. Cheers, Aidan Roberts",
    }
    rv = client.post("/api/ascents/send-project-climbed-message", token=user_token, json=project_climbed_data)
    assert rv.status_code == 400

    # Try for a non existing line
    project_climbed_data = {
        "line": "1c39fd1f-6341-4161-a83f-e5de0f861c49",
        "message": "I climbed the project! I think it's a 9A+ boulder. Cheers, Aidan Roberts",
    }

    rv = client.post("/api/ascents/send-project-climbed-message", token=user_token, json=project_climbed_data)
    assert rv.status_code == 404


def test_grade_ranking_votes(client, user_token):
    line_id = Line.get_id_by_slug("treppe")

    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": False,
        "hard": False,
        "withKneepad": True,
        "rating": 5,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 22,
        "line": line_id,
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=user_token, json=ascent_data)
    assert 200 <= rv.status_code < 300

    update_grades_and_rating(line_id)

    line = Line.find_by_id(line_id)
    assert line.author_grade_value == 1
    assert line.user_grade_value == 22
    assert line.author_rating == 1
    assert line.user_rating == 5


def test_grade_ranking_votes_multiple(client, user_token, member_token, admin_token):
    line_id = Line.get_id_by_slug("treppe")

    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": False,
        "hard": False,
        "withKneepad": True,
        "rating": 5,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 11,
        "line": line_id,
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=user_token, json=ascent_data)
    assert 200 <= rv.status_code < 300
    rv = client.post("/api/ascents", token=member_token, json=ascent_data)
    assert 200 <= rv.status_code < 300
    rv = client.post("/api/ascents", token=admin_token, json=ascent_data)
    assert 200 <= rv.status_code < 300

    update_grades_and_rating(line_id)

    line = Line.find_by_id(line_id)
    assert line.author_grade_value == 1
    assert line.user_grade_value == 11
    assert line.author_rating == 1
    assert line.user_rating == 5


def test_grade_ranking_votes_multiple_2(client, user_token, member_token, admin_token, moderator_token):
    line_id = Line.get_id_by_slug("treppe")

    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": False,
        "hard": False,
        "withKneepad": True,
        "rating": 5,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 16,
        "line": line_id,
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=user_token, json=ascent_data)
    assert 200 <= rv.status_code < 300
    rv = client.post("/api/ascents", token=member_token, json=ascent_data)
    assert 200 <= rv.status_code < 300

    ascent_data["hard"] = True

    rv = client.post("/api/ascents", token=admin_token, json=ascent_data)
    assert 200 <= rv.status_code < 300
    rv = client.post("/api/ascents", token=moderator_token, json=ascent_data)
    assert 200 <= rv.status_code < 300

    update_grades_and_rating(line_id)

    line = Line.find_by_id(line_id)
    assert line.author_grade_value == 1
    assert line.user_grade_value == 16
    assert line.author_rating == 1
    assert line.user_rating == 5


def test_disable_fa_in_ascents_enforced_on_create(client, member_token):
    # Enable the setting to disable FA in ascents
    instance_settings = InstanceSettings.return_it()
    instance_settings.disable_fa_in_ascents = True
    db.session.add(instance_settings)

    ascent_data = {
        "flash": False,
        "fa": True,  # client tries to set FA
        "soft": False,
        "hard": False,
        "withKneepad": False,
        "rating": 4,
        "comment": "should not be FA",
        "year": None,
        "gradeValue": 11,
        "line": str(Line.get_id_by_slug("treppe")),
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=member_token, json=ascent_data)
    assert rv.status_code == 201
    res = rv.json
    assert res["fa"] is False  # enforced by instance setting


def test_successful_validate_soft_hard(client, member_token):
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": True,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeValue": 11,
        "line": str(Line.get_id_by_slug("treppe")),
        "date": "2024-04-13",
    }

    rv = client.post("/api/ascents", token=member_token, json=ascent_data)
    assert rv.status_code == 400
