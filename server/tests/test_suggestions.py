from extensions import db
from models.area import Area
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
from models.tabu_area import TabuArea
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
    assert slug in {item["slug"] for item in moderator.json["items"]}
    editor = client.get("/api/lines/for-line-editor/shark-attack", token=moderator_token)
    assert slug not in {item["slug"] for item in editor.json}
    queue = client.get("/api/suggestions", token=moderator_token)
    queued_line = next(item for item in queue.json["lines"] if item["slug"] == slug)
    assert queued_line["createdBy"]["firstname"] == "member"
    assert queued_line["createdBy"]["lastname"] == "member"

    hidden = client.get(f"/api/lines/{slug}", token=user_token)
    assert hidden.status_code == 404
    visible_to_moderator = client.get(f"/api/lines/{slug}", token=moderator_token)
    assert visible_to_moderator.status_code == 200
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
    assert str(line.id) in {path["line"]["id"] for path in moderator_image["linePaths"]}

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
    db.session.add(
        TabuArea(
            id=existing_area["id"],
            topo_image_id=topo_image.id,
            path=existing_area["path"],
            order_index=0,
            created_by_id=published_path.line.created_by_id,
        )
    )
    published_path.tabu_area_ids = ["existing-tabu"]
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
    db.session.refresh(published_path)
    saved_ids = [
        area.id
        for area in TabuArea.query.filter_by(topo_image_id=topo_image.id).order_by(TabuArea.order_index.asc()).all()
    ]
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
    kept = TabuArea.query.filter_by(topo_image_id=topo_image.id, id="existing-tabu").one()
    assert kept.path == existing_area["path"]


def test_member_cannot_drop_unowned_tabu_area(client, member_token):
    created = _create_draft_line(client, member_token, "Unowned Tabu")
    line = Line.find_by_slug(created.json["slug"])
    topo_image = TopoImage.query.filter_by(area_id=line.area_id).order_by(TopoImage.order_index.asc()).first()
    published_path = LinePath.query.filter_by(topo_image_id=topo_image.id).first()
    stray_path = [4.0, 4.0, 12.0, 4.0, 12.0, 12.0]
    db.session.add(
        TabuArea(
            id="stray-tabu",
            topo_image_id=topo_image.id,
            path=stray_path,
            order_index=0,
            created_by_id=published_path.line.created_by_id,
        )
    )
    db.session.commit()

    response = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={
            "tabuAreas": [],
            "linePaths": [
                {"line": str(line.id), "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]},
            ],
        },
    )
    assert response.status_code == 200, response.text
    stray = TabuArea.query.filter_by(topo_image_id=topo_image.id, id="stray-tabu").one()
    assert stray.path == stray_path
    assert stray.created_by_id == published_path.line.created_by_id


def test_moderator_keeps_tabu_area_used_by_hidden_draft(client, member_token, moderator_token):
    created = _create_draft_line(client, member_token, "Hidden Tabu Draft")
    line = Line.find_by_slug(created.json["slug"])
    topo_image = TopoImage.query.filter_by(area_id=line.area_id).order_by(TopoImage.order_index.asc()).first()
    hidden = {"id": "hidden-tabu", "path": [5.0, 5.0, 15.0, 5.0, 15.0, 15.0]}
    drawn = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=member_token,
        json={
            "tabuAreas": [hidden],
            "linePaths": [
                {
                    "line": str(line.id),
                    "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0],
                    "tabuAreaIds": ["hidden-tabu"],
                }
            ],
        },
    )
    assert drawn.status_code == 200, drawn.text

    published_paths = [
        {
            "id": str(path.id),
            "line": str(path.line_id),
            "path": path.path,
            "tabuAreaIds": path.tabu_area_ids or [],
        }
        for path in LinePath.query.filter_by(topo_image_id=topo_image.id).all()
        if path.line is not None and path.line.publication_status == PublicationStatusEnum.PUBLISHED
    ]
    kept_areas = [
        {"id": area.id, "path": area.path}
        for area in TabuArea.query.filter_by(topo_image_id=topo_image.id).all()
        if area.id != "hidden-tabu"
    ]
    moderator_sync = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={"linePaths": published_paths, "tabuAreas": kept_areas},
    )
    assert moderator_sync.status_code == 200, moderator_sync.text
    hidden_row = TabuArea.query.filter_by(topo_image_id=topo_image.id, id="hidden-tabu").one()
    assert hidden_row.path == hidden["path"]
    draft = LinePath.query.filter_by(topo_image_id=topo_image.id, line_id=line.id).one()
    assert draft.tabu_area_ids == ["hidden-tabu"]

    reshaped = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={
            "linePaths": published_paths,
            "tabuAreas": kept_areas + [{"id": "hidden-tabu", "path": [1.0, 1.0, 2.0, 1.0, 2.0, 2.0]}],
        },
    )
    assert reshaped.status_code == 400
    hidden_row = TabuArea.query.filter_by(topo_image_id=topo_image.id, id="hidden-tabu").one()
    assert hidden_row.path == hidden["path"]


def test_moderator_sync_keeps_omitted_archived_and_rejected_paths(client, moderator_token):
    archived_response = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_boulder_line_payload("Kept Archived", 10),
    )
    assert archived_response.status_code == 201, archived_response.text
    rejected_response = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_boulder_line_payload("Kept Rejected", 11),
    )
    assert rejected_response.status_code == 201, rejected_response.text
    draft_response = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_boulder_line_payload("Dropped Own Draft", 12),
    )
    assert draft_response.status_code == 201, draft_response.text

    archived = Line.find_by_slug(archived_response.json["slug"])
    rejected = Line.find_by_slug(rejected_response.json["slug"])
    own_draft = Line.find_by_slug(draft_response.json["slug"])
    topo_image = TopoImage.query.filter_by(area_id=archived.area_id).order_by(TopoImage.order_index.asc()).first()
    archived_path = [8.0, 8.0, 18.0, 8.0, 18.0, 18.0]
    rejected_path = [9.0, 9.0, 19.0, 9.0, 19.0, 19.0]
    hidden = {"id": "archived-only-tabu", "path": [6.0, 6.0, 16.0, 6.0, 16.0, 16.0]}
    drawn = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={
            "tabuAreas": [hidden],
            "linePaths": [
                {"line": str(archived.id), "path": archived_path, "tabuAreaIds": ["archived-only-tabu"]},
                {"line": str(rejected.id), "path": rejected_path},
                {"line": str(own_draft.id), "path": [7.0, 7.0, 17.0, 7.0, 17.0, 17.0]},
            ],
        },
    )
    assert drawn.status_code == 200, drawn.text

    archived.publication_status = PublicationStatusEnum.ARCHIVED
    rejected.publication_status = PublicationStatusEnum.REJECTED
    own_draft.publication_status = PublicationStatusEnum.DRAFT
    db.session.commit()

    omitted = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={"tabuAreas": [], "linePaths": []},
    )
    assert omitted.status_code == 200, omitted.text
    kept_archived = LinePath.query.filter_by(topo_image_id=topo_image.id, line_id=archived.id).one()
    assert kept_archived.path == archived_path
    kept_rejected = LinePath.query.filter_by(topo_image_id=topo_image.id, line_id=rejected.id).one()
    assert kept_rejected.path == rejected_path
    assert LinePath.query.filter_by(topo_image_id=topo_image.id, line_id=own_draft.id).count() == 0
    area = TabuArea.query.filter_by(topo_image_id=topo_image.id, id="archived-only-tabu").one()
    assert area.path == hidden["path"]


def test_moderator_can_edit_tabu_area_owned_by_someone_else(client, moderator_token):
    stairs = Line.find_by_slug("the-vessel")
    topo_image = TopoImage.query.filter_by(area_id=stairs.area_id).order_by(TopoImage.order_index.desc()).first()
    owner_id = stairs.created_by_id
    updated = [11.0, 11.0, 21.0, 11.0, 21.0, 21.0]
    db.session.add(
        TabuArea(
            id="owned-by-someone-else",
            topo_image_id=topo_image.id,
            path=[10.0, 10.0, 20.0, 10.0, 20.0, 20.0],
            order_index=0,
            created_by_id=owner_id,
        )
    )
    db.session.commit()

    response = client.put(
        f"/api/topo-images/{topo_image.id}/line-paths",
        token=moderator_token,
        json={
            "tabuAreas": [{"id": "owned-by-someone-else", "path": updated}],
            "linePaths": [
                {
                    "line": str(stairs.id),
                    "path": [1, 2, 3, 4],
                    "tabuAreaIds": ["owned-by-someone-else"],
                }
            ],
        },
    )
    assert response.status_code == 200, response.text
    row = TabuArea.query.filter_by(topo_image_id=topo_image.id, id="owned-by-someone-else").one()
    assert row.path == updated
    assert row.created_by_id == owner_id


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
    assert image_id in {image["id"] for image in moderator_images}
    visible_to_moderator = client.get(f"/api/topo-images/{image_id}", token=moderator_token)
    assert visible_to_moderator.status_code == 200
    own_images = client.get("/api/areas/shark-attack/topo-images", token=member_token).json
    assert image_id in {image["id"] for image in own_images}

    queue = client.get("/api/suggestions", token=moderator_token)
    assert queue.status_code == 200
    queued_image = next(item for item in queue.json["topoImages"] if item["id"] == image_id)
    assert queued_image["image"]["id"] == str(file.id)
    assert queued_image["createdBy"]["firstname"] == "member"
    assert queued_image["createdBy"]["lastname"] == "member"


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
    denied_edit = client.put(
        f"/api/lines/{slug}",
        token=moderator_token,
        json=_boulder_line_payload("Not Their Edit", 10),
    )
    assert denied_edit.status_code == 401
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
    denied_image_edit = client.put(
        f"/api/topo-images/{image_id}",
        token=moderator_token,
        json={"image": str(file.id), "title": "Changed", "description": None, "mapMarkers": []},
    )
    assert denied_image_edit.status_code == 401
    assert TopoImage.query.filter_by(id=image_id).first().publication_status == PublicationStatusEnum.DRAFT

    deleted = client.delete(f"/api/lines/{slug}", token=member_token)
    assert deleted.status_code == 204
    assert Line.query.filter_by(slug=slug).first() is None


def test_suggestion_does_not_change_secret_or_closure_schedules(client, member_token):
    area = Area.find_by_slug("shark-attack")
    area.secret = True
    db.session.commit()

    payload = _boulder_line_payload("Secret Suggestion", 10)
    payload["secret"] = False
    payload["closureSchedules"] = [
        {
            "scheduleType": "ANNUAL",
            "reason": "Nesting",
            "startMonth": 1,
            "startDay": 1,
            "endMonth": 3,
            "endDay": 1,
        }
    ]
    created = client.post("/api/areas/shark-attack/lines", token=member_token, json=payload)
    assert created.status_code == 201, created.text
    line = Line.find_by_slug(created.json["slug"])
    assert line.secret is True
    assert line.closure_schedules == []
    assert Area.find_by_slug("shark-attack").secret is True

    payload["name"] = "Secret Suggestion Edit"
    payload["secret"] = False
    updated = client.put(f"/api/lines/{line.slug}", token=member_token, json=payload)
    assert updated.status_code == 200, updated.text
    db.session.refresh(line)
    assert line.secret is True
    assert line.closure_schedules == []
    assert Area.find_by_slug("shark-attack").secret is True


def test_moderator_can_reorder_while_a_rejected_image_exists(client, member_token, moderator_token):
    file = File.query.first()
    created = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={"image": str(file.id), "title": "Reorder around me", "description": None, "mapMarkers": []},
    )
    assert created.status_code == 201, created.text
    image_id = created.json["id"]
    rejected = client.post(f"/api/topo-images/{image_id}/reject", token=moderator_token, json={})
    assert rejected.status_code == 204, rejected.text
    kept = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={"image": str(file.id), "title": "Still a draft", "description": None, "mapMarkers": []},
    )
    assert kept.status_code == 201, kept.text

    images = client.get("/api/areas/shark-attack/topo-images", token=moderator_token).json
    assert image_id not in {image["id"] for image in images}
    assert kept.json["id"] in {image["id"] for image in images}
    order = {image["id"]: index for index, image in enumerate(images)}
    response = client.put(
        "/api/areas/shark-attack/topo-images/update-order",
        token=moderator_token,
        json=order,
    )
    assert response.status_code == 200, response.text


def test_only_draft_owner_can_draw_or_reorder_a_draft_topo_image(client, member_token, moderator_token):
    file = File.query.first()
    created = client.post(
        "/api/areas/shark-attack/topo-images",
        token=member_token,
        json={"image": str(file.id), "title": "Owner draws", "description": None, "mapMarkers": []},
    )
    assert created.status_code == 201, created.text
    image_id = created.json["id"]
    line = _create_draft_line(client, member_token, "Line On Draft Image")
    assert line.status_code == 201, line.text
    line_id = Line.find_by_slug(line.json["slug"]).id

    drawn = client.put(
        f"/api/topo-images/{image_id}/line-paths",
        token=member_token,
        json={"linePaths": [{"line": str(line_id), "path": [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]}]},
    )
    assert drawn.status_code == 200, drawn.text
    path = LinePath.query.filter_by(topo_image_id=image_id, line_id=line_id).one()

    blocked_draw = client.put(
        f"/api/topo-images/{image_id}/line-paths",
        token=moderator_token,
        json={
            "linePaths": [
                {"id": str(path.id), "line": str(line_id), "path": [11.0, 21.0, 31.0, 41.0, 51.0, 61.0]},
            ]
        },
    )
    assert blocked_draw.status_code == 401
    db.session.refresh(path)
    assert path.path == [10.0, 20.0, 30.0, 40.0, 50.0, 60.0]

    blocked_order = client.put(
        f"/api/topo-images/{image_id}/line-paths/update-order",
        token=moderator_token,
        json={str(path.id): 0},
    )
    assert blocked_order.status_code == 401
    owner_order = client.put(
        f"/api/topo-images/{image_id}/line-paths/update-order",
        token=member_token,
        json={str(path.id): 0},
    )
    assert owner_order.status_code == 200, owner_order.text

    blocked_delete = client.delete(f"/api/line-paths/{path.id}", token=moderator_token)
    assert blocked_delete.status_code == 401
    assert LinePath.query.filter_by(id=path.id).count() == 1

    published = TopoImage.query.filter_by(publication_status=PublicationStatusEnum.PUBLISHED).first()
    blocked_published_order = client.put(
        f"/api/topo-images/{published.id}/line-paths/update-order",
        token=member_token,
        json={},
    )
    assert blocked_published_order.status_code == 401
