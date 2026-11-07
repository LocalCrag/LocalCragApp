from extensions import db
from models.enums.notification_type_enum import NotificationTypeEnum
from models.file import File
from models.file_link import FileLink
from models.instance_settings import InstanceSettings
from models.line import Line
from models.notification import Notification
from models.video import Video
from util.notification_digest_builder import build_digest_items
from util.videos import provider_for_url


def _line_payload(name, videos):
    return {
        "name": name,
        "description": "Super Boulder",
        "videos": videos,
        "authorGradeValue": 19,
        "gradeScale": "FB",
        "type": "BOULDER",
        "authorRating": 5,
        "faYear": 2016,
        "faDate": None,
        "faName": "Dave Graham",
        "startingPosition": "STAND",
        "eliminate": False,
        "traverse": False,
        "highball": False,
        "morpho": False,
        "variant": False,
        "lowball": False,
        "noTopout": False,
        "badDropzone": False,
        "childFriendly": False,
        "roof": False,
        "slab": False,
        "vertical": False,
        "overhang": False,
        "athletic": False,
        "technical": False,
        "endurance": False,
        "cruxy": False,
        "dyno": False,
        "jugs": False,
        "sloper": False,
        "crimps": False,
        "pockets": False,
        "pinches": False,
        "crack": False,
        "dihedral": False,
        "compression": False,
        "arete": False,
        "mantle": False,
        "secret": False,
        "closureSchedules": [],
    }


def _ascent_payload(line_id, video=None):
    payload = {
        "flash": False,
        "fa": False,
        "soft": False,
        "hard": False,
        "withKneepad": False,
        "rating": 3,
        "comment": "Sent it",
        "year": None,
        "gradeValue": 11,
        "line": line_id,
        "date": "2024-04-13",
    }
    if video is not None:
        payload["video"] = video
    return payload


def test_provider_for_url_accepts_the_three_hosts():
    assert provider_for_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "youtube"
    assert provider_for_url("https://youtu.be/dQw4w9WgXcQ") == "youtube"
    assert provider_for_url("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ") == "youtube"
    assert provider_for_url("https://vimeo.com/123456789") == "vimeo"
    assert provider_for_url("https://www.instagram.com/reel/Abcde12345/") == "instagram"
    assert provider_for_url("https://example.com/watch") is None
    assert provider_for_url("https://notyoutube-nocookie.com/embed/dQw4w9WgXcQ") is None
    assert provider_for_url("https://evil-youtube-nocookie.com/watch?v=dQw4w9WgXcQ") is None


def test_line_accepts_vimeo_and_instagram_and_rejects_other_hosts(client, moderator_token):
    vimeo = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_line_payload(
            "Vimeo line",
            [{"url": "https://vimeo.com/123456789", "title": "Send"}],
        ),
    )
    assert vimeo.status_code == 201
    assert vimeo.json["videos"][0]["source"] == "vimeo"

    instagram = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_line_payload(
            "Instagram line",
            [
                {
                    "url": "https://www.instagram.com/p/Abcde12345/",
                    "title": "Reel",
                    "startSeconds": 30,
                }
            ],
        ),
    )
    assert instagram.status_code == 201
    assert instagram.json["videos"][0]["source"] == "instagram"
    assert instagram.json["videos"][0]["startSeconds"] is None

    rejected = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_line_payload("Other host", [{"url": "https://example.com/video", "title": "Nope"}]),
    )
    assert rejected.status_code == 400


def test_line_keeps_a_legacy_video_url(client, moderator_token):
    created = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_line_payload(
            "Legacy video",
            [{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Video"}],
        ),
    )
    assert created.status_code == 201
    line = Line.find_by_slug(created.json["slug"])
    line.videos = [Video.from_dict({"url": "https://example.com/old-beta", "title": "Old"}, 0)]
    db.session.commit()

    kept = client.put(
        f"/api/lines/{line.slug}",
        token=moderator_token,
        json=_line_payload("Legacy video", [{"url": "https://example.com/old-beta", "title": "Old"}]),
    )
    assert kept.status_code == 200
    assert kept.json["videos"][0]["source"] == "link"

    replaced = client.put(
        f"/api/lines/{line.slug}",
        token=moderator_token,
        json=_line_payload("Legacy video", [{"url": "https://example.org/new", "title": "New"}]),
    )
    assert replaced.status_code == 400


def test_line_video_upload_respects_the_instance_setting(client, moderator_token):
    upload = File()
    upload.filename = "send.mp4"
    upload.original_filename = "send.mp4"
    db.session.add(upload)
    db.session.commit()

    disabled = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_line_payload(
            "Upload off",
            [{"title": "Send", "source": "upload", "fileId": str(upload.id)}],
        ),
    )
    assert disabled.status_code == 400

    settings = InstanceSettings.return_it()
    settings.video_uploads_enabled = True
    db.session.commit()

    enabled = client.post(
        "/api/areas/shark-attack/lines",
        token=moderator_token,
        json=_line_payload(
            "Upload on",
            [{"title": "Send", "source": "upload", "fileId": str(upload.id)}],
        ),
    )
    assert enabled.status_code == 201
    assert enabled.json["videos"][0]["source"] == "upload"
    assert enabled.json["videos"][0]["fileId"] == str(upload.id)
    line = Line.find_by_slug(enabled.json["slug"])
    assert FileLink.query.filter_by(object_type="Line", object_id=line.id, field_name="videos").count() == 1

    removed = client.put(
        f"/api/lines/{line.slug}",
        token=moderator_token,
        json=_line_payload("Upload on", []),
    )
    assert removed.status_code == 200
    assert FileLink.query.filter_by(object_type="Line", object_id=line.id, field_name="videos").count() == 0
    assert db.session.get(File, upload.id) is None


def test_ascent_video_links_and_moderation(client, member_token, user_token, moderator_token):
    from models.line import Line as LineModel

    line = LineModel.find_by_slug("the-vessel")
    created = client.post(
        "/api/ascents",
        token=member_token,
        json=_ascent_payload(
            str(line.id),
            {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Send", "startSeconds": 15},
        ),
    )
    assert created.status_code == 201
    assert created.json["video"]["source"] == "youtube"
    assert created.json["video"]["startSeconds"] == 15
    ascent_id = created.json["id"]

    rejected = client.put(
        f"/api/ascents/{ascent_id}",
        token=member_token,
        json=_ascent_payload(str(line.id), {"url": "https://example.com/send", "title": "Nope"}),
    )
    assert rejected.status_code == 400

    upload_rejected = client.put(
        f"/api/ascents/{ascent_id}",
        token=member_token,
        json=_ascent_payload(
            str(line.id),
            {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Send",
                "source": "upload",
                "fileId": "nope",
            },
        ),
    )
    assert upload_rejected.status_code == 400

    forbidden = client.put(
        f"/api/ascents/{ascent_id}/videos",
        token=user_token,
        json={"video": None},
    )
    assert forbidden.status_code == 401

    added = client.put(
        f"/api/ascents/{ascent_id}/videos",
        token=moderator_token,
        json={"video": {"url": "https://vimeo.com/123456789", "title": "Send"}},
    )
    assert added.status_code == 400

    bookmarked = client.put(
        f"/api/ascents/{ascent_id}/videos",
        token=moderator_token,
        json={
            "video": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "title": "Send",
                "startSeconds": 42,
            }
        },
    )
    assert bookmarked.status_code == 200
    assert bookmarked.json["video"]["startSeconds"] == 42
    assert (
        Notification.query.filter(
            Notification.type == NotificationTypeEnum.ASCENT_VIDEO_REMOVED,
            Notification.entity_id == ascent_id,
        ).count()
        == 0
    )

    detail = client.get("/api/lines/the-vessel")
    assert detail.status_code == 200
    assert detail.json["ascentVideos"][0]["ascentId"] == ascent_id
    assert detail.json["ascentVideos"][0]["video"]["startSeconds"] == 42

    removed = client.put(
        f"/api/ascents/{ascent_id}/videos",
        token=moderator_token,
        json={"video": None, "message": "  Not this send.  "},
    )
    assert removed.status_code == 200
    assert removed.json["video"] is None
    note = Notification.query.filter(
        Notification.type == NotificationTypeEnum.ASCENT_VIDEO_REMOVED,
        Notification.entity_id == ascent_id,
    ).one()
    assert note.message == "Not this send."
    listed = client.get("/api/account/notifications?include_dismissed=1", token=member_token)
    row = next(item for item in listed.json["items"] if item["id"] == str(note.id))
    assert row["properties"]["ascentVideoRemoval"]["message"] == "Not this send."
    items = build_digest_items([note], None)
    assert f"notifications?ascentVideoRemoval={note.id}" in items[0]["html"]
    assert "Not this send." not in items[0]["html"]

    detail = client.get("/api/lines/the-vessel")
    assert detail.json["ascentVideos"] == []
