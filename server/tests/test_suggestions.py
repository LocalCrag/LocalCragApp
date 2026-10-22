from extensions import db
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.permission_effect_enum import PermissionEffectEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.file import File
from models.instance_settings import InstanceSettings
from models.line import Line
from models.line_path import LinePath
from models.notification import Notification
from models.permission import SUGGESTION_CREATE, Permission
from models.searchable import Searchable
from models.topo_image import TopoImage
from models.user import User
from tests.test_line_resources import _boulder_line_payload


def _create_draft_line(client, token, name="Suggested Boulder"):
    response = client.post("/api/areas/shark-attack/lines", token=token, json=_boulder_line_payload(name, 10))
    return response


def test_member_line_is_draft_and_hidden_from_other_users(client, member_token, user_token, moderator_token):
    created = _create_draft_line(client, member_token)
    assert created.status_code == 201, created.text
    assert created.json["publicationStatus"] == "draft"
    slug = created.json["slug"]

    anonymous = client.get("/api/lines?area_slug=shark-attack&per_page=50")
    assert slug not in {item["slug"] for item in anonymous.json["items"]}

    other = client.get("/api/lines?area_slug=shark-attack&per_page=50", token=user_token)
    assert slug not in {item["slug"] for item in other.json["items"]}

    owner = client.get("/api/lines?area_slug=shark-attack&per_page=50", token=member_token)
    assert slug in {item["slug"] for item in owner.json["items"]}

    moderator = client.get("/api/lines?area_slug=shark-attack&per_page=50", token=moderator_token)
    assert slug not in {item["slug"] for item in moderator.json["items"]}
    editor = client.get("/api/lines/for-line-editor/shark-attack", token=moderator_token)
    assert slug not in {item["slug"] for item in editor.json}
    queue = client.get("/api/suggestions", token=moderator_token)
    assert slug in {item["slug"] for item in queue.json["lines"]}

    hidden = client.get(f"/api/lines/{slug}", token=user_token)
    assert hidden.status_code == 404
    hidden_from_moderator = client.get(f"/api/lines/{slug}", token=moderator_token)
    assert hidden_from_moderator.status_code == 404
    visible = client.get(f"/api/lines/{slug}", token=member_token)
    assert visible.status_code == 200

    line = Line.find_by_slug(slug)
    assert Searchable.query.filter_by(id=line.id).first() is None


def test_draft_line_cannot_be_ticked(client, member_token):
    created = _create_draft_line(client, member_token, "Untickable Draft")
    assert created.status_code == 201, created.text
    line = Line.find_by_slug(created.json["slug"])
    response = client.post(
        "/api/ascents",
        token=member_token,
        json={
            "line": str(line.id),
            "flash": False,
            "fa": False,
            "soft": False,
            "hard": False,
            "withKneepad": False,
            "gradeValue": 10,
            "rating": 1,
            "comment": None,
            "year": None,
            "date": None,
            "gradeScale": "FB",
        },
    )
    assert response.status_code == 400


def test_moderator_create_stays_published(client, moderator_token):
    response = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_boulder_line_payload("Moderator Public", 10),
    )
    assert response.status_code == 201, response.text
    assert response.json["publicationStatus"] == "published"


def test_publish_and_reject_notify_the_author(client, member_token, moderator_token, user_token):
    created = _create_draft_line(client, member_token, "Review Me")
    slug = created.json["slug"]
    author = User.find_by_email("member@localcrag.invalid.org")

    queue = client.get("/api/suggestions", token=moderator_token)
    assert queue.status_code == 200
    queued_line = next(item for item in queue.json["lines"] if item["slug"] == slug)
    assert queued_line["linePaths"] == []
    assert client.get("/api/suggestions", token=member_token).status_code == 401

    published = client.post(
        f"/api/lines/{slug}/publish",
        token=moderator_token,
        json={"message": "Looks good"},
    )
    assert published.status_code == 200, published.text
    assert published.json["publicationStatus"] == "published"
    note = Notification.query.filter_by(
        user_id=author.id,
        type=NotificationTypeEnum.SUGGESTION_PUBLISHED,
    ).first()
    assert note is not None
    assert note.message == "Looks good"
    public = client.get(f"/api/lines/{slug}")
    assert public.status_code == 200

    second = _create_draft_line(client, member_token, "Reject Me")
    rejected = client.post(
        f"/api/lines/{second.json['slug']}/reject",
        token=moderator_token,
        json={"message": "Duplicate"},
    )
    assert rejected.status_code == 204
    rejected_slug = second.json["slug"]
    for token in (None, user_token, member_token, moderator_token):
        gone = client.get(f"/api/lines/{rejected_slug}", token=token)
        assert gone.status_code == 404
        listed = client.get("/api/lines?area_slug=shark-attack&per_page=50", token=token)
        assert rejected_slug not in {item["slug"] for item in listed.json["items"]}
    rejection = Notification.query.filter_by(
        user_id=author.id,
        type=NotificationTypeEnum.SUGGESTION_REJECTED,
    ).first()
    assert rejection is not None
    assert rejection.message == "Duplicate"


def test_instance_setting_and_permission_block_new_suggestions(client, user_token, moderator_token):
    settings = InstanceSettings.return_it()
    settings.suggestions_enabled = False
    db.session.add(settings)
    db.session.commit()
    blocked = _create_draft_line(client, user_token, "Disabled")
    assert blocked.status_code == 401

    settings.suggestions_enabled = True
    db.session.add(settings)
    db.session.commit()
    user = User.find_by_email("user@localcrag.invalid.org")
    denied = client.put(
        f"/api/users/{user.id}/suggestion-permission",
        token=moderator_token,
        json={"suggestionsEnabled": False},
    )
    assert denied.status_code == 200, denied.text
    assert denied.json["suggestionsEnabled"] is False
    blocked_user = _create_draft_line(client, user_token, "Denied")
    assert blocked_user.status_code == 401
    assert Permission.global_deny(user.id, SUGGESTION_CREATE).effect == PermissionEffectEnum.DENY


def test_member_path_sync_keeps_published_paths(client, member_token, moderator_token):
    created = _create_draft_line(client, member_token, "Drawn Draft")
    assert created.status_code == 201, created.text
    line = Line.find_by_slug(created.json["slug"])
    topo_image = TopoImage.query.filter_by(area_id=line.area_id).order_by(TopoImage.order_index.asc()).first()
    before = LinePath.query.filter_by(topo_image_id=topo_image.id).count()
    assert before > 0

    response = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={
            "linePaths": [
                {"line": str(line.id), "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]},
            ]
        },
    )
    assert response.status_code == 200, response.text
    after = LinePath.query.filter_by(topo_image_id=topo_image.id).all()
    assert len(after) == before + 1
    assert any(str(path.line_id) == str(line.id) for path in after)

    owner_image = client.get(f"/api/topo-images/{topo_image.id}", token=member_token).json
    assert str(line.id) in {path["line"]["id"] for path in owner_image["linePaths"]}
    moderator_image = client.get(f"/api/topo-images/{topo_image.id}", token=moderator_token).json
    assert str(line.id) not in {path["line"]["id"] for path in moderator_image["linePaths"]}

    kept_paths = [
        {"id": str(path.id), "line": str(path.line_id), "path": path.path}
        for path in after
        if str(path.line_id) != str(line.id)
    ]
    moderator_sync = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={"linePaths": kept_paths},
    )
    assert moderator_sync.status_code == 200, moderator_sync.text
    assert LinePath.query.filter_by(topo_image_id=topo_image.id, line_id=line.id).count() == 1


def test_member_can_add_tabu_area_without_changing_existing_ones(client, member_token):
    created = _create_draft_line(client, member_token, "Tabu Draft")
    line = Line.find_by_slug(created.json["slug"])
    topo_image = TopoImage.query.filter_by(area_id=line.area_id).order_by(TopoImage.order_index.asc()).first()
    published_path = LinePath.query.filter_by(topo_image_id=topo_image.id).first()
    existing_area = {"id": "existing-tabu", "path": [1.0, 1.0, 20.0, 1.0, 20.0, 20.0]}
    topo_image.tabu_areas = [existing_area]
    published_path.tabu_area_ids = ["existing-tabu"]
    db.session.add(topo_image)
    db.session.add(published_path)
    db.session.commit()

    new_area = {"id": "new-tabu", "path": [30.0, 30.0, 50.0, 30.0, 50.0, 50.0]}
    response = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={
            "tabuAreas": [new_area],
            "linePaths": [
                {
                    "line": str(line.id),
                    "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0],
                    "tabuAreaIds": ["new-tabu", "existing-tabu"],
                },
            ],
        },
    )
    assert response.status_code == 200, response.text
    db.session.refresh(topo_image)
    db.session.refresh(published_path)
    saved_ids = [area["id"] for area in topo_image.tabu_areas]
    assert saved_ids == ["existing-tabu", "new-tabu"]
    own_path = LinePath.query.filter_by(topo_image_id=topo_image.id, line_id=line.id).one()
    assert own_path.tabu_area_ids == ["new-tabu", "existing-tabu"]
    assert published_path.tabu_area_ids == ["existing-tabu"]

    changed = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={
            "tabuAreas": [
                {"id": "existing-tabu", "path": [2.0, 2.0, 22.0, 2.0, 22.0, 22.0]},
                new_area,
            ],
            "linePaths": [
                {
                    "line": str(line.id),
                    "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0],
                    "tabuAreaIds": ["new-tabu"],
                },
            ],
        },
    )
    assert changed.status_code == 400
    db.session.refresh(topo_image)
    assert topo_image.tabu_areas[0]["path"] == existing_area["path"]


def test_member_line_editor_lists_only_own_drafts(client, member_token, user_token):
    published = client.get("/api/lines/for-line-editor/shark-attack")
    assert published.status_code == 200
    assert len(published.json) >= 1

    before_draft = client.get("/api/lines/for-line-editor/shark-attack", token=member_token)
    assert before_draft.status_code == 200
    assert before_draft.json == []

    created = _create_draft_line(client, member_token, "Own Draft")
    other = _create_draft_line(client, user_token, "Other Draft")
    own = client.get("/api/lines/for-line-editor/shark-attack", token=member_token)
    assert own.status_code == 200
    assert [item["slug"] for item in own.json] == [created.json["slug"]]

    line = Line.find_by_slug(created.json["slug"])
    topo_image = TopoImage.query.filter_by(area_id=line.area_id).order_by(TopoImage.order_index.asc()).first()
    published_path_count = LinePath.query.filter_by(topo_image_id=topo_image.id).count()
    blocked = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={
            "linePaths": [
                {"line": published.json[0]["id"], "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]},
            ]
        },
    )
    assert blocked.status_code == 400
    other_line = Line.find_by_slug(other.json["slug"])
    blocked_other = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={
            "linePaths": [
                {"line": str(other_line.id), "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]},
            ]
        },
    )
    assert blocked_other.status_code == 400
    assert LinePath.query.filter_by(topo_image_id=topo_image.id).count() == published_path_count


def test_member_can_add_draft_topo_image(client, member_token, user_token, moderator_token):
    file = File.query.first()
    response = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={"image": str(file.id), "title": "Draft wall", "description": None, "mapMarkers": []},
    )
    assert response.status_code == 201, response.text
    assert response.json["publicationStatus"] == "draft"
    image_id = response.json["id"]

    hidden = client.get(f"/api/topo-images/{image_id}", token=user_token)
    assert hidden.status_code == 404
    visible = client.get(f"/api/topo-images/{image_id}", token=member_token)
    assert visible.status_code == 200

    images = client.get("/api/areas/shark-attack/topo-images", token=user_token).json
    assert image_id not in {image["id"] for image in images}
    moderator_images = client.get("/api/areas/shark-attack/topo-images", token=moderator_token).json
    assert image_id not in {image["id"] for image in moderator_images}
    hidden_from_moderator = client.get(f"/api/topo-images/{image_id}", token=moderator_token)
    assert hidden_from_moderator.status_code == 404
    own_images = client.get("/api/areas/shark-attack/topo-images", token=member_token).json
    assert image_id in {image["id"] for image in own_images}

    queue = client.get("/api/suggestions", token=moderator_token)
    assert queue.status_code == 200
    queued_image = next(item for item in queue.json["topoImages"] if item["id"] == image_id)
    assert queued_image["image"]["id"] == str(file.id)


def test_rejecting_draft_topo_image_deletes_line_paths(client, member_token, moderator_token):
    created = _create_draft_line(client, member_token, "Path On Draft Image")
    assert created.status_code == 201, created.text
    line = Line.find_by_slug(created.json["slug"])
    published_image = (
        TopoImage.query.filter_by(area_id=line.area_id, publication_status=PublicationStatusEnum.PUBLISHED)
        .order_by(TopoImage.order_index.asc())
        .first()
    )
    file = File.query.first()
    image_response = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={"image": str(file.id), "title": "Reject me", "description": None, "mapMarkers": []},
    )
    assert image_response.status_code == 201, image_response.text
    image_id = image_response.json["id"]

    on_draft = client.put(
        f"/api/topo-images/{image_id}/line-paths",
        token=member_token,
        json={"linePaths": [{"line": str(line.id), "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]}]},
    )
    assert on_draft.status_code == 200, on_draft.text
    on_published = client.put(
        f"/api/topo-images/{published_image.id}/line-paths",
        token=member_token,
        json={"linePaths": [{"line": str(line.id), "path": [12.0, 22.0, 32.0, 42.0, 52.0, 62.0]}]},
    )
    assert on_published.status_code == 200, on_published.text

    rejected = client.post(f"/api/topo-images/{image_id}/reject", token=moderator_token, json={})
    assert rejected.status_code == 204, rejected.text
    kept = TopoImage.query.filter_by(id=image_id).first()
    assert kept is not None
    assert kept.publication_status == PublicationStatusEnum.REJECTED
    assert LinePath.query.filter_by(topo_image_id=image_id).count() == 0
    assert LinePath.query.filter_by(line_id=line.id, topo_image_id=published_image.id).count() == 1

    queue = client.get("/api/suggestions", token=moderator_token)
    assert queue.status_code == 200
    queued_line = next(item for item in queue.json["lines"] if item["slug"] == created.json["slug"])
    assert all(path["topoImage"]["id"] != image_id for path in queued_line["linePaths"])
    assert image_id not in {item["id"] for item in queue.json["topoImages"]}


def test_moderator_cannot_delete_another_users_draft(client, member_token, moderator_token):
    created = _create_draft_line(client, member_token, "Not Their Draft")
    assert created.status_code == 201, created.text
    slug = created.json["slug"]

    denied = client.delete(f"/api/lines/{slug}", token=moderator_token)
    assert denied.status_code == 401
    assert Line.find_by_slug(slug).publication_status == PublicationStatusEnum.DRAFT

    file = File.query.first()
    image = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={"image": str(file.id), "title": "Not Their Image", "description": None, "mapMarkers": []},
    )
    assert image.status_code == 201, image.text
    image_id = image.json["id"]
    denied_image = client.delete(f"/api/topo-images/{image_id}", token=moderator_token)
    assert denied_image.status_code == 401
    assert TopoImage.query.filter_by(id=image_id).first().publication_status == PublicationStatusEnum.DRAFT

    deleted = client.delete(f"/api/lines/{slug}", token=member_token)
    assert deleted.status_code == 204
    assert Line.query.filter_by(slug=slug).first() is None
