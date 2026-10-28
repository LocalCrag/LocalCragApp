from extensions import db
from models.ascent import Ascent
from models.instance_settings import InstanceSettings
from models.line import Line
from models.user import User


def _ascent(line: Line):
    ascent = Ascent()
    ascent.grade_value = line.user_grade_value
    ascent.rating = line.user_rating
    ascent.date = "2024-04-16"
    ascent.ascent_date = "2024-04-16"
    ascent.created_by_id = User.find_by_email("admin@localcrag.invalid.org").id
    ascent.line_id = line.id
    db.session.add(ascent)
    db.session.flush()


def _settings(**flags):
    settings = InstanceSettings.return_it()
    for name, value in flags.items():
        setattr(settings, name, value)
    db.session.add(settings)
    db.session.flush()
    return settings


def test_rating_controversies_require_a_moderator(client, user_token):
    anonymous = client.get("/api/rating-controversies")
    assert anonymous.status_code == 401

    denied = client.get("/api/rating-controversies", token=user_token)
    assert denied.status_code == 401


def test_grade_mismatch_without_an_ascent_is_excluded(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.user_grade_value = vessel.author_grade_value + 6
    db.session.flush()

    rv = client.get("/api/rating-controversies?kind=grade", token=moderator_token)
    assert rv.status_code == 200, rv.json
    assert "the-vessel" not in {item["slug"] for item in rv.json["items"]}


def test_lists_grade_and_rating_controversies_separately(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.user_grade_value = vessel.author_grade_value + 6
    db.session.flush()
    _ascent(vessel)

    grades = client.get("/api/rating-controversies?kind=grade&minAscents=1", token=moderator_token)
    assert grades.status_code == 200, grades.json
    assert grades.json["kind"] == "grade"
    assert grades.json["compareGrades"] is True
    assert grades.json["compareRatings"] is True
    grade_slugs = {item["slug"]: item for item in grades.json["items"]}
    assert grade_slugs["the-vessel"]["gradeDiffers"] is True
    assert grade_slugs["the-vessel"]["ascentCount"] >= 1
    assert grade_slugs["the-vessel"]["crag"]["slug"]
    assert "super-spreader" not in grade_slugs

    ratings = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    rating_slugs = {item["slug"]: item for item in ratings.json["items"]}
    assert rating_slugs["super-spreader"]["ratingDiffers"] is True
    assert rating_slugs["super-spreader"]["ascentCount"] >= 1
    assert "the-vessel" not in rating_slugs

    default = client.get("/api/rating-controversies", token=moderator_token)
    assert default.json["kind"] == "grade"


def test_missing_author_rating_is_not_a_controversy(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.author_rating = None
    vessel.user_rating = 4
    db.session.flush()
    _ascent(vessel)

    rv = client.get("/api/rating-controversies?kind=rating", token=moderator_token)
    assert rv.status_code == 200
    assert "the-vessel" not in {item["slug"] for item in rv.json["items"]}


def test_null_rating_counts_as_a_difference(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.user_rating = None
    db.session.flush()
    _ascent(vessel)

    rv = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert rv.status_code == 200
    by_slug = {item["slug"]: item for item in rv.json["items"]}
    assert by_slug["the-vessel"]["ratingDiffers"] is True
    assert by_slug["the-vessel"]["userRating"] is None


def test_only_compares_fields_still_shown_as_author_values(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.user_grade_value = vessel.author_grade_value + 4
    vessel.user_rating = vessel.author_rating
    spreader = Line.find_by_slug("super-spreader")
    assert spreader.author_rating != spreader.user_rating
    db.session.flush()
    _ascent(vessel)

    _settings(display_user_grades=True, display_user_ratings=False)
    ratings_only = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert ratings_only.status_code == 200
    assert ratings_only.json["compareGrades"] is False
    assert ratings_only.json["compareRatings"] is True
    slugs = {item["slug"] for item in ratings_only.json["items"]}
    assert "super-spreader" in slugs
    assert "the-vessel" not in slugs

    _settings(display_user_grades=False, display_user_ratings=True)
    grades_only = client.get("/api/rating-controversies?kind=grade&minAscents=1", token=moderator_token)
    assert grades_only.json["compareGrades"] is True
    assert grades_only.json["compareRatings"] is True
    slugs = {item["slug"] for item in grades_only.json["items"]}
    assert "the-vessel" in slugs
    assert "super-spreader" not in slugs
    stars = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert "super-spreader" in {item["slug"] for item in stars.json["items"]}


def test_hidden_when_community_values_are_what_the_topo_shows(client, moderator_token):
    _settings(display_user_grades=True, display_user_ratings=True)
    rv = client.get("/api/rating-controversies", token=moderator_token)
    assert rv.status_code == 200
    assert rv.json == {
        "items": [],
        "hasNext": False,
        "kind": None,
        "compareGrades": False,
        "compareRatings": False,
    }


def test_min_ascents_filters_lines(client, moderator_token):
    included = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert "super-spreader" in {item["slug"] for item in included.json["items"]}

    default = client.get("/api/rating-controversies?kind=rating", token=moderator_token)
    assert "super-spreader" not in {item["slug"] for item in default.json["items"]}

    excluded = client.get("/api/rating-controversies?kind=rating&minAscents=2", token=moderator_token)
    assert excluded.status_code == 200
    assert "super-spreader" not in {item["slug"] for item in excluded.json["items"]}

    invalid = client.get("/api/rating-controversies?minAscents=4", token=moderator_token)
    assert invalid.status_code == 400


def test_rejects_invalid_kind(client, moderator_token):
    rv = client.get("/api/rating-controversies?kind=both", token=moderator_token)
    assert rv.status_code == 400


def test_rejects_invalid_pagination(client, moderator_token):
    rv = client.get("/api/rating-controversies?page=0", token=moderator_token)
    assert rv.status_code == 400


def _slugs(response):
    return {item["slug"] for item in response.json["items"]}


def test_orders_by_gap_then_ascent_count(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    spreader = Line.find_by_slug("super-spreader")
    vessel.user_grade_value = vessel.author_grade_value + 4
    spreader.user_grade_value = spreader.author_grade_value + 4
    db.session.flush()
    _ascent(vessel)
    second = Ascent()
    second.grade_value = vessel.user_grade_value
    second.rating = vessel.user_rating
    second.date = "2024-04-17"
    second.ascent_date = "2024-04-17"
    second.created_by_id = User.find_by_email("member@localcrag.invalid.org").id
    second.line_id = vessel.id
    db.session.add(second)
    db.session.flush()

    def positions():
        rv = client.get("/api/rating-controversies?kind=grade&minAscents=1&per_page=50", token=moderator_token)
        assert rv.status_code == 200, rv.json
        slugs = [item["slug"] for item in rv.json["items"]]
        return slugs.index("the-vessel"), slugs.index("super-spreader")

    vessel_at, spreader_at = positions()
    assert vessel_at < spreader_at

    spreader.user_grade_value = spreader.author_grade_value + 8
    db.session.flush()
    vessel_at, spreader_at = positions()
    assert spreader_at < vessel_at


def test_dismissed_grade_stays_hidden_while_the_gap_is_unchanged(client, moderator_token, user_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.user_grade_value = vessel.author_grade_value + 6
    db.session.flush()
    _ascent(vessel)

    denied = client.post(
        f"/api/rating-controversies/{vessel.id}",
        token=user_token,
        json={"kind": "grade"},
    )
    assert denied.status_code == 401

    dismissed = client.post(
        f"/api/rating-controversies/{vessel.id}",
        token=moderator_token,
        json={"kind": "grade"},
    )
    assert dismissed.status_code == 200, dismissed.json
    assert dismissed.json["gap"] == 6
    hidden = client.get("/api/rating-controversies?kind=grade&minAscents=1", token=moderator_token)
    assert "the-vessel" not in _slugs(hidden)

    vessel.author_grade_value += 1
    vessel.user_grade_value += 1
    db.session.flush()
    still_hidden = client.get("/api/rating-controversies?kind=grade&minAscents=1", token=moderator_token)
    assert "the-vessel" not in _slugs(still_hidden)

    vessel.user_grade_value = vessel.author_grade_value + 4
    db.session.flush()
    shown = client.get("/api/rating-controversies?kind=grade&minAscents=1", token=moderator_token)
    assert "the-vessel" in _slugs(shown)


def test_dismissed_rating_returns_when_the_gap_changes(client, moderator_token):
    spreader = Line.find_by_slug("super-spreader")
    dismissed = client.post(
        f"/api/rating-controversies/{spreader.id}",
        token=moderator_token,
        json={"kind": "rating"},
    )
    assert dismissed.status_code == 200, dismissed.json
    assert dismissed.json["gap"] == spreader.user_rating - spreader.author_rating
    hidden = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert "super-spreader" not in _slugs(hidden)

    spreader.author_rating -= 1
    spreader.user_rating -= 1
    db.session.flush()
    still_hidden = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert "super-spreader" not in _slugs(still_hidden)

    spreader.user_rating -= 1
    db.session.flush()
    shown = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert "super-spreader" in _slugs(shown)


def test_missing_community_rating_is_its_own_gap(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.user_rating = None
    db.session.flush()
    _ascent(vessel)

    dismissed = client.post(
        f"/api/rating-controversies/{vessel.id}",
        token=moderator_token,
        json={"kind": "rating"},
    )
    assert dismissed.status_code == 200, dismissed.json
    assert dismissed.json["gap"] is None
    hidden = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert "the-vessel" not in _slugs(hidden)

    vessel.user_rating = 4
    db.session.flush()
    shown = client.get("/api/rating-controversies?kind=rating&minAscents=1", token=moderator_token)
    assert "the-vessel" in _slugs(shown)


def test_dismiss_rejects_a_line_that_does_not_differ(client, moderator_token):
    vessel = Line.find_by_slug("the-vessel")
    rv = client.post(
        f"/api/rating-controversies/{vessel.id}",
        token=moderator_token,
        json={"kind": "grade"},
    )
    assert rv.status_code == 400
    invalid = client.post(
        f"/api/rating-controversies/{vessel.id}",
        token=moderator_token,
        json={"kind": "both"},
    )
    assert invalid.status_code == 400


def test_reset_clears_dismissals_for_an_admin(client, moderator_token, admin_token):
    vessel = Line.find_by_slug("the-vessel")
    vessel.user_grade_value = vessel.author_grade_value + 6
    db.session.flush()
    _ascent(vessel)
    client.post(
        f"/api/rating-controversies/{vessel.id}",
        token=moderator_token,
        json={"kind": "grade"},
    )

    refused = client.post("/api/rating-controversies/reset", token=moderator_token, json={"confirmation": "RESTART"})
    assert refused.status_code == 401
    wrong = client.post("/api/rating-controversies/reset", token=admin_token, json={"confirmation": "no"})
    assert wrong.status_code == 400
    still_hidden = client.get("/api/rating-controversies?kind=grade&minAscents=1", token=moderator_token)
    assert "the-vessel" not in _slugs(still_hidden)

    reset = client.post("/api/rating-controversies/reset", token=admin_token, json={"confirmation": "RESTART"})
    assert reset.status_code == 200, reset.json
    assert reset.json["restarted"] is True
    shown = client.get("/api/rating-controversies?kind=grade&minAscents=1", token=moderator_token)
    assert "the-vessel" in _slugs(shown)
