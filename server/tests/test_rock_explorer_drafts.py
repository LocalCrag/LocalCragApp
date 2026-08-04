"""Wave 0 stubs for Rock Explorer live-tracking drafts (Phase 10).

Skipped until Plans 02/03 implement HTTP ownership, lock, clone, and GeoJSON filtering.
"""

import pytest


def _draft_payload(**overrides):
    data = {
        "status": "draft",
        "title": "Live session",
        "description": None,
        "potential": None,
        "geometry": None,
        "recordingDeviceId": "device-a",
        "recordingState": "recording",
        "paths": [],
        "parkingSites": [],
        "accessIssues": [],
        "topoLinks": [],
    }
    data.update(overrides)
    return data


def test_draft_payload_helper_shape():
    payload = _draft_payload()
    assert payload["status"] == "draft"
    for key in (
        "title",
        "description",
        "potential",
        "geometry",
        "recordingDeviceId",
        "recordingState",
        "paths",
        "parkingSites",
        "accessIssues",
        "topoLinks",
    ):
        assert key in payload


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_draft_excluded_from_geojson(client, member_token):
    """RE-TRACK-01, T-10-04: drafts omitted from GeoJSON; published included."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_draft_idor_get_denied_for_non_owner(client, member_token, admin_token):
    """RE-TRACK-01, T-10-01: non-owner GET draft by id → 401."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_draft_recording_metadata_persisted(client, member_token):
    """RE-TRACK-02: draft stores device/state and multi-path source:gps."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_path_rich_coords_accepted(client, member_token):
    """RE-TRACK-02: rich Position arrays and plain [lng,lat] both accepted."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_draft_put_replaces_paths_no_append_route(client, member_token):
    """RE-TRACK-03, D-08: PUT grows paths; invented /append route → 404."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_device_lock_wrong_device_conflict(client, member_token):
    """RE-TRACK-04, T-10-02: wrong recordingDeviceId → 409; matching → 200/204."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_clone_draft_copies_paths_and_images(client, member_token):
    """RE-TRACK-04, T-10-03: clone new id, paths, device; duplicate gallery tags."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_published_create_still_geojson_visible(client, member_token):
    """D-15: omit status (default published); appears in GeoJSON."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_gallery_list_draft_tag_denied_for_non_owner(client, member_token, admin_token):
    """T-10-05: non-owner gallery list by draft tag-object-id → 401."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_comment_on_others_draft_denied(client, member_token, admin_token):
    """T-10-05: non-owner POST comment targeting draft → 401."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_owner_draft_list_status_filter(client, member_token, admin_token):
    """RE-TRACK-01: owner GET ?status=draft returns own drafts only."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_gallery_create_draft_tag_denied_for_non_owner(client, member_token, admin_token):
    """T-10-05: non-owner POST gallery image tagged to others' draft → 401."""
    pass


@pytest.mark.skip(reason="Phase 10 Wave 0 — implement in plan 02/03")
def test_published_requires_geometry_and_potential(client, member_token):
    """T-10-06 / D-04: published with null geometry or potential → 400."""
    pass
