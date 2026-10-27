"""Add or remove a user's stored topo points when a quality gate changes.

Points are a running total. Publishing a line, spot, or topo image pays a
small base to the person who publishes it. Fields a member already put on a
draft are paid to that member when the draft is published, not to the
moderator who clicks publish. The person who later adds or removes a valuable
property, such as GPS, gets the difference. Editing something that is already
counted, such as a second video or a replacement photo, adds a single bonus
point. Nothing is awarded when the request has no logged-in user, so
migrations and seeds stay put until the backfill assigns existing rows to
their creators.
"""

from __future__ import annotations

import uuid

from sqlalchemy import event, inspect, text
from sqlalchemy.orm import Session

from extensions import db
from models.area import Area
from models.crag import Crag
from models.instance_settings import InstanceSettings
from models.line import Line
from models.line_path import LinePath
from models.map_marker import MapMarker
from models.sector import Sector
from models.topo_image import TopoImage
from models.user import User
from util.topo_quality_score import (
    CREATE_ITEM,
    EDIT_BONUS,
    LINE_DRAWN,
    LINE_FA,
    LINE_STYLE,
    LINE_VIDEO,
    SPOT_DESCRIPTION,
    SPOT_GPS,
    SPOT_IMAGE,
    SPOT_PARKING,
    STYLE_FIELDS,
    TOPO_GPS,
    description_earned_max,
    fa_complete,
    gate_delta,
    has_text,
    has_video,
    is_published,
    is_styled,
    publish_delta,
)

# Models whose flush can move a score. Spots are a crag, a sector, or an area.
_RELEVANT = (Line, LinePath, TopoImage, MapMarker, Area, Sector, Crag)
_SPOT_MODELS = {"crag": Crag, "sector": Sector, "area": Area}
_SPOT_FK = {"crag": "crag_id", "sector": "sector_id", "area": "area_id"}
_GPS_TYPE = {"crag": "CRAG", "sector": "SECTOR", "area": "AREA"}
# Distinct from None: a column that has no previous value because the row is new.
_MISSING = object()


def register_topo_contribution_listener(session: Session | None = None) -> None:
    """Attach the scoring hook to one session.

    The app session is used when none is passed. Tests pass the session they
    swapped in, because the hook is not registered on the Session class.
    """
    target = db.session if session is None else session
    if event.contains(target, "before_flush", award_topo_points):
        return
    event.listen(target, "before_flush", award_topo_points)


def award_topo_points(session: Session, _flush_context, _instances) -> None:
    """Write this flush's point changes onto user rows.

    Credits that belong to the signed-in user are folded into their own
    delta, which is also what the toast shows. Other users, such as the
    author of a published draft, are updated here and get no toast. The flag
    stops those user updates from being scored again.
    """
    if session.info.get("awarding_topo_points"):
        return
    if not _has_relevant_changes(session):
        return
    actor_id = _actor_id()
    if actor_id is None:
        return
    delta, credits = compute_topo_points_delta(session)
    if actor_id in credits:
        delta += credits.pop(actor_id)
    if not delta and not credits:
        return
    session.info["awarding_topo_points"] = True
    try:
        account = session.get(User, actor_id)
        if account is not None and delta:
            account.topo_points = int(account.topo_points or 0) + delta
        for user_id, points in credits.items():
            if not points:
                continue
            author = session.get(User, user_id)
            if author is None:
                continue
            author.topo_points = int(author.topo_points or 0) + points
    finally:
        session.info["awarding_topo_points"] = False
    if not delta:
        return
    # Only the actor's own change is announced. Credits to other users stay silent.
    from flask import g

    g.topo_points_delta = getattr(g, "topo_points_delta", 0) + delta


def compute_topo_points_delta(session: Session) -> tuple[int, dict]:
    """Score every line, description quota, topo image, and spot in this flush.

    The first value is the signed-in user's change. The dict maps other user
    ids to points for work that was already on a draft.
    """
    # Primary keys and the published default are filled in during the INSERT,
    # after this hook. Create scoring needs both in order to see GPS and the
    # other gates on a brand new row.
    _ensure_pending_ids(session)
    gym = bool(InstanceSettings.return_it().gym_mode)
    delta = 0
    credits: dict = {}
    area_ids = set()
    for line_id in _affected_line_ids(session):
        line_delta, before_area, after_area = _line_delta(session, line_id, gym, credits)
        delta += line_delta
        if before_area is not None:
            area_ids.add(before_area)
        if after_area is not None:
            area_ids.add(after_area)
    # A line that moves can change the quota of both its old and new area.
    for area_id in area_ids:
        description_delta, description_credits = _description_delta(session, area_id, gym)
        delta += description_delta
        _add_credits(credits, description_credits)
    for topo_id in _affected_topo_ids(session):
        delta += _topo_delta(session, topo_id, gym, credits)
    for level, spot_id in _affected_spots(session):
        delta += _spot_delta(session, level, spot_id, gym)
    return delta, credits


def _add_credits(credits: dict, extra: dict) -> None:
    """Add points owed to other users. A missing user or a zero change is skipped."""
    for user_id, points in extra.items():
        if user_id is None or not points:
            continue
        credits[user_id] = credits.get(user_id, 0) + points


def _ensure_pending_ids(session: Session) -> None:
    """Give new rows an id before the flush assigns one.

    Marker lookup and the description quota both need that id while the row
    is still pending.
    """
    for obj in list(session.new):
        if isinstance(obj, _RELEVANT) and getattr(obj, "id", None) is None:
            obj.id = uuid.uuid4()


def _is_published_now(obj) -> bool:
    """Whether the row counts as published after this flush.

    A new row whose status is still empty uses the column default, which is
    published. An explicit draft stays unpublished.
    """
    status = getattr(obj, "publication_status", None)
    if status is None and (inspect(obj).pending or inspect(obj).transient):
        return True
    return is_published(status)


def _publishing_draft(obj) -> bool:
    """An existing draft is becoming published in this flush.

    A brand new published row is not this case. Restoring an archived row is
    not either: only a previous status of draft counts.
    """
    state = inspect(obj)
    if state.pending or state.deleted or state.transient:
        return False
    before = _value_before(obj, "publication_status")
    return _enum_value(before) == "draft" and is_published(getattr(obj, "publication_status", None))


def _has_relevant_changes(session: Session) -> bool:
    """True when this flush touches a line, path, topo image, marker, or spot."""
    for collection in (session.new, session.dirty, session.deleted):
        for obj in collection:
            if isinstance(obj, _RELEVANT):
                return True
    return False


def _actor_id():
    """Id of the signed-in user, or None outside a request.

    Migrations and the backfill have no request, so they change rows without
    moving anyone's score.
    """
    from flask import has_request_context

    if not has_request_context():
        return None
    from util.auth_session import get_current_user

    user = get_current_user()
    if user is None:
        return None
    return user.id


def _value_before(obj, attr):
    """Column value from before this flush. A new row has none."""
    state = inspect(obj)
    if state.pending or state.transient:
        return _MISSING
    history = state.attrs[attr].history
    if history.deleted:
        return history.deleted[0]
    return getattr(obj, attr)


def _changed(obj, *attrs) -> bool:
    """True when one of these columns was written in this flush.

    A new or deleted row counts as changed, because every field appeared or
    disappeared with it.
    """
    if obj is None:
        return False
    state = inspect(obj)
    if state.pending or state.transient or state.deleted:
        return True
    return any(state.attrs[attr].history.has_changes() for attr in attrs)


def _enum_value(value) -> str | None:
    """Plain string for a status or marker type, whether or not it is an enum."""
    if value is None or value is _MISSING:
        return None
    return value.value if hasattr(value, "value") else str(value)


def _marker_host_ids(session: Session, marker: MapMarker, fk: str, relation: str, host_type) -> set:
    """Ids of the spot or topo image a marker belongs to.

    On a new marker the foreign key is still empty at this point in the
    flush. The parent already holds the marker in its collection, so that
    link is used as well.
    """
    ids = set()
    current = getattr(marker, fk)
    if current is not None:
        ids.add(current)
    related = marker.__dict__.get(relation)
    if related is not None and related is not _MISSING:
        host_id = getattr(related, "id", None)
        if host_id is not None:
            ids.add(host_id)
    # Pending markers are not in the database yet. Walk loaded parents and
    # see whose map_markers collection already contains this instance.
    seen = set()
    candidates = list(session.new) + list(session.dirty) + list(session.deleted)
    candidates.extend(session.identity_map.values())
    for obj in candidates:
        if id(obj) in seen or not isinstance(obj, host_type):
            continue
        seen.add(id(obj))
        markers = obj.__dict__.get("map_markers")
        if markers is None:
            continue
        if any(item is marker for item in markers):
            if obj.id is not None:
                ids.add(obj.id)
    return ids


def _coords(lat, lng) -> bool:
    """True when both latitude and longitude are set."""
    return lat is not None and lng is not None


def _affected_line_ids(session: Session) -> set:
    """Lines inserted, edited, deleted, or whose drawn path changed."""
    ids = set()
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if isinstance(obj, Line):
            ids.add(obj.id)
        elif isinstance(obj, LinePath) and obj.line_id is not None:
            ids.add(obj.line_id)
    return ids


def _line_in_session(session: Session, line_id):
    """The line from this flush when it is there, otherwise the loaded row."""
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if isinstance(obj, Line) and obj.id == line_id:
            return obj
    return session.get(Line, line_id)


def _path_counts(session: Session, line_id) -> tuple[int, int]:
    """How many drawn paths the line had, and how many it will have.

    The count still sees the database. Paths added or removed in this flush
    are applied on top.
    """
    db_count = (
        session.connection()
        .execute(text("SELECT COUNT(*) FROM line_paths WHERE line_id = :line_id"), {"line_id": line_id})
        .scalar()
        or 0
    )
    extra = sum(1 for obj in session.new if isinstance(obj, LinePath) and obj.line_id == line_id)
    removed = sum(1 for obj in session.deleted if isinstance(obj, LinePath) and obj.line_id == line_id)
    return int(db_count), int(db_count) + extra - removed


def _path_geometry_changed(session: Session, line_id) -> bool:
    """True when a path was added, removed, or its geometry was rewritten."""
    for obj in list(session.new) + list(session.deleted):
        if isinstance(obj, LinePath) and obj.line_id == line_id:
            return True
    for obj in session.dirty:
        if isinstance(obj, LinePath) and obj.line_id == line_id and _changed(obj, "path"):
            return True
    return False


def _facts(source, drawn: bool, gym: bool, published: bool) -> dict:
    """Which line gates are on. An unpublished line turns every gate off."""
    if source is None or source is _MISSING:
        return {"published": False, "drawn": False, "styled": False, "video": False, "fa": False}
    return {
        "published": published,
        "drawn": drawn and published,
        "styled": is_styled(source) and published,
        "video": has_video(source.videos if not isinstance(source, dict) else source.get("videos")) and published,
        "fa": fa_complete(source, gym) and published,
    }


def _line_delta(session: Session, line_id, gym: bool, credits: dict) -> tuple[int, object, object]:
    """Points for one line, plus the areas whose description quota may change.

    The signed-in user gets the publish base and any gate they turn on or
    off in this flush. Gates already filled on a draft are credited to the
    line's creator instead.
    """
    line = _line_in_session(session, line_id)
    if line is None:
        return 0, None, None
    state = inspect(line)
    before_count, after_count = _path_counts(session, line_id)
    geometry_changed = _path_geometry_changed(session, line_id)
    if state.pending:
        before = _facts(None, False, gym, False)
        after_source = line
        after_published = _is_published_now(line)
        after = _facts(after_source, after_count > 0, gym, after_published)
        before_area = None
        after_area = line.area_id
        style_changed = True
        video_changed = True
        fa_changed = True
    elif state.deleted:
        before_published = is_published(line.publication_status)
        before = _facts(line, before_count > 0, gym, before_published)
        after = _facts(None, False, gym, False)
        before_area = line.area_id
        after_area = None
        style_changed = True
        video_changed = True
        fa_changed = True
    else:
        before_published = is_published(_value_before(line, "publication_status"))
        after_published = is_published(line.publication_status)
        before_values = {
            field: _value_before(line, field)
            for field in ("videos", *STYLE_FIELDS, "fa_name", "fa_date", "fa_year", "routesetter", "set_date")
        }
        before_obj = _AttrBag(before_values, line, use_before=True)
        before = _facts(before_obj, before_count > 0, gym, before_published)
        after = _facts(line, after_count > 0, gym, after_published)
        before_area = _value_before(line, "area_id")
        after_area = line.area_id
        style_changed = _changed(line, *STYLE_FIELDS)
        video_changed = _changed(line, "videos")
        fa_fields = ("routesetter", "set_date") if gym else ("fa_name", "fa_date", "fa_year")
        fa_changed = _changed(line, *fa_fields)
        if _publishing_draft(line):
            # Fields already stored on the draft belong to its author. The
            # publisher is scored as if those fields were already counted.
            prior = _facts(before_obj, before_count > 0, gym, True)
            _add_credits(
                credits,
                {
                    line.created_by_id: (
                        gate_delta(False, prior["drawn"], False, LINE_DRAWN)
                        + gate_delta(False, prior["styled"], False, LINE_STYLE)
                        + gate_delta(False, prior["video"], False, LINE_VIDEO)
                        + gate_delta(False, prior["fa"], False, LINE_FA)
                    )
                },
            )
            before = prior
            after = _facts(line, after_count > 0, gym, True)

    drawn_changed = before_count != after_count or geometry_changed
    # The publish click itself pays only the base. `before` already includes
    # the draft's gates, so only a change made in this same flush still pays
    # the publisher.
    if not state.pending and not state.deleted and _publishing_draft(line):
        delta = CREATE_ITEM
    else:
        delta = publish_delta(before["published"], after["published"])
    delta += gate_delta(before["drawn"], after["drawn"], drawn_changed, LINE_DRAWN)
    delta += gate_delta(before["styled"], after["styled"], style_changed, LINE_STYLE)
    delta += gate_delta(before["video"], after["video"], video_changed, LINE_VIDEO)
    delta += gate_delta(before["fa"], after["fa"], fa_changed, LINE_FA)
    return delta, before_area, after_area


class _AttrBag:
    """Reads pre-flush column values while leaving the live object untouched."""

    def __init__(self, values: dict, fallback, use_before: bool):
        self._values = values
        self._fallback = fallback

    def __getattr__(self, name):
        if name in self._values and self._values[name] is not _MISSING:
            return self._values[name]
        return getattr(self._fallback, name)


def _description_delta(session: Session, area_id, gym: bool) -> tuple[int, dict]:
    """Points for the line-description quota in one area.

    Outdoors, each published line with a description is worth two points until
    the area reaches ceil(20% of its published lines). Gym mode pays nothing.
    The first value is the signed-in user's change: filling a free slot,
    losing one, or the one-point edit bonus for rewriting a description that
    is already counted or for adding one past the quota. The second value
    credits draft authors. When a draft that already has a description is
    published, that slot's points go to the line's creator, not to the person
    who clicks publish.
    """
    if gym or area_id is None:
        return 0, {}
    # The database is the before picture. Inserts, deletes, and edits in this
    # flush are applied on a copy so the quota can be compared.
    rows = session.connection().execute(
        text("SELECT id, publication_status, description FROM lines WHERE area_id = :area_id"),
        {"area_id": area_id},
    )
    before = {}
    for row in rows:
        before[row.id] = (is_published(row.publication_status), has_text(row.description))
    after = dict(before)

    def apply_line(line: Line, target: dict, present: bool):
        if not present:
            target.pop(line.id, None)
            return
        # A line that moved to another area no longer counts here.
        if line.area_id == area_id:
            target[line.id] = (_is_published_now(line), has_text(line.description))
        else:
            target.pop(line.id, None)

    for line in list(session.deleted):
        if isinstance(line, Line) and line.id in after:
            after.pop(line.id, None)
    for line in list(session.new):
        if isinstance(line, Line):
            apply_line(line, after, True)
    # A dirty line counts when it is in this area now or was before the flush.
    for line in list(session.dirty):
        if not isinstance(line, Line):
            continue
        old_area = _value_before(line, "area_id")
        if old_area == area_id or line.area_id == area_id:
            apply_line(line, after, True)

    before_earned, _before_max = description_earned_max(
        sum(1 for published, _described in before.values() if published),
        sum(1 for published, described in before.values() if published and described),
        gym,
    )
    after_earned, _after_max = description_earned_max(
        sum(1 for published, _described in after.values() if published),
        sum(1 for published, described in after.values() if published and described),
        gym,
    )
    point_delta = after_earned - before_earned
    credits: dict = {}
    # Drafts published in this flush whose description was already written.
    # Those slot points belong to the author, so they are left out while the
    # publisher's share is measured.
    carried = []
    for line in list(session.dirty):
        if not isinstance(line, Line) or line.area_id != area_id or not _publishing_draft(line):
            continue
        if has_text(_value_before(line, "description")):
            carried.append(line)
    if carried:
        shadow = dict(after)
        for line in carried:
            if line.id in shadow:
                _published, described = shadow[line.id]
                shadow[line.id] = (False, described)
        cursor, _shadow_max = description_earned_max(
            sum(1 for published, _described in shadow.values() if published),
            sum(1 for published, described in shadow.values() if published and described),
            gym,
        )
        actor_delta = cursor - before_earned
        # Turn the carried lines back on one at a time. Each step that fills
        # a free slot is credited to that line's creator.
        state = dict(shadow)
        for line in carried:
            if line.id not in after:
                continue
            state[line.id] = after[line.id]
            step, _step_max = description_earned_max(
                sum(1 for published, _described in state.values() if published),
                sum(1 for published, described in state.values() if published and described),
                gym,
            )
            marginal = step - cursor
            cursor = step
            if marginal and line.created_by_id:
                credits[line.created_by_id] = credits.get(line.created_by_id, 0) + marginal
    else:
        actor_delta = point_delta
    # Rewriting a counted description, or adding one when the quota is already
    # full, pays the edit bonus instead of another slot.
    for line in list(session.new) + list(session.dirty):
        if not isinstance(line, Line) or line.area_id != area_id:
            continue
        if not _changed(line, "description"):
            continue
        before_has = before.get(line.id, (False, False))[1] if line.id in before else False
        after_has = has_text(line.description) and _is_published_now(line)
        if before_has and after_has:
            actor_delta += EDIT_BONUS
        elif after_has and not before_has and point_delta == 0:
            actor_delta += EDIT_BONUS
    return actor_delta, credits


def _affected_topo_ids(session: Session) -> set:
    """Topo images inserted, edited, deleted, or whose GPS marker changed."""
    ids = set()
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if isinstance(obj, TopoImage):
            ids.add(obj.id)
        elif isinstance(obj, MapMarker):
            ids.update(_marker_host_ids(session, obj, "topo_image_id", "topo_image", TopoImage))
            previous = _value_before(obj, "topo_image_id")
            if previous is not _MISSING and previous is not None:
                ids.add(previous)
    return ids


def _topo_in_session(session: Session, topo_id):
    """The topo image from this flush when it is there, otherwise the loaded row."""
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if isinstance(obj, TopoImage) and obj.id == topo_id:
            return obj
    return session.get(TopoImage, topo_id)


def _presence(
    session: Session, sql: str, params: dict, match, type_value: str | None = None
) -> tuple[bool, bool, bool]:
    """Whether a marker kind had coordinates before, after, and if that changed.

    `match` decides which session markers belong to this host. `type_value`
    limits the database rows to one marker type, such as parking.
    """
    rows = session.connection().execute(text(sql), params)
    before_map = {}
    for row in rows:
        if type_value is not None and _enum_value(row.type) != type_value:
            continue
        before_map[row.id] = _coords(row.lat, row.lng)
    after_map = dict(before_map)
    changed = False
    for obj in list(session.deleted):
        if isinstance(obj, MapMarker) and match(obj, before=True) and obj.id in after_map:
            if after_map.pop(obj.id):
                changed = True
    for obj in list(session.new):
        if isinstance(obj, MapMarker) and match(obj, before=False):
            has_coords = _coords(obj.lat, obj.lng)
            after_map[obj.id] = has_coords
            if has_coords:
                changed = True
    for obj in list(session.dirty):
        if not isinstance(obj, MapMarker):
            continue
        was = match(obj, before=True)
        now = match(obj, before=False)
        # Leaving this host, or losing coordinates, turns the gate off.
        if was and not now:
            if after_map.pop(obj.id, False):
                changed = True
        elif now:
            has_coords = _coords(obj.lat, obj.lng)
            previous = after_map.get(obj.id)
            after_map[obj.id] = has_coords
            if previous != has_coords or _changed(obj, "lat", "lng"):
                changed = True
    return any(before_map.values()), any(after_map.values()), changed


def _topo_delta(session: Session, topo_id, gym: bool, credits: dict) -> int:
    """Points for one topo image.

    Outdoors, a GPS pin is its own gate. Publishing a draft pays the base to
    the publisher. A pin that was already on the draft is paid to the image's
    creator. Gym mode has no topo GPS points.
    """
    image = _topo_in_session(session, topo_id)
    if image is None:
        return 0
    state = inspect(image)
    if state.pending:
        before_published = False
        after_published = _is_published_now(image)
    elif state.deleted:
        before_published = is_published(image.publication_status)
        after_published = False
    else:
        before_published = is_published(_value_before(image, "publication_status"))
        after_published = is_published(image.publication_status)

    def match(marker: MapMarker, before: bool) -> bool:
        if before and not inspect(marker).pending:
            target = _value_before(marker, "topo_image_id")
            if target is _MISSING:
                target = marker.topo_image_id
            return target == topo_id
        # A new marker's foreign key is still empty here. The parent collection
        # already holds it; the column is copied later in the flush.
        return topo_id in _marker_host_ids(session, marker, "topo_image_id", "topo_image", TopoImage)

    before_gps, after_gps, gps_changed = _presence(
        session,
        "SELECT id, lat, lng FROM map_markers WHERE topo_image_id = :topo_id",
        {"topo_id": topo_id},
        match,
    )
    if state.deleted:
        after_gps = False
    points = 0 if gym else TOPO_GPS
    publishing = not state.pending and not state.deleted and _publishing_draft(image)
    if publishing:
        # The pin already on the draft belongs to its author. A pin added in
        # this same flush still pays the publisher through the gate below.
        if before_gps and points and image.created_by_id:
            _add_credits(credits, {image.created_by_id: points})
        return CREATE_ITEM + gate_delta(before_gps, after_gps, gps_changed, points)
    delta = publish_delta(before_published, after_published)
    delta += gate_delta(
        before_published and before_gps,
        after_published and after_gps,
        gps_changed or before_published != after_published,
        points,
    )
    return delta


def _affected_spots(session: Session) -> set[tuple[str, object]]:
    """Crags, sectors, and areas inserted, edited, deleted, or whose markers changed."""
    spots = set()
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if isinstance(obj, Crag):
            spots.add(("crag", obj.id))
        elif isinstance(obj, Sector):
            spots.add(("sector", obj.id))
        elif isinstance(obj, Area):
            spots.add(("area", obj.id))
        elif isinstance(obj, MapMarker):
            for level, fk in _SPOT_FK.items():
                for spot_id in _marker_host_ids(session, obj, fk, level, _SPOT_MODELS[level]):
                    spots.add((level, spot_id))
                previous = _value_before(obj, fk)
                if previous is not _MISSING and previous is not None:
                    spots.add((level, previous))
    return spots


def _spot_object(session: Session, level: str, spot_id):
    """The spot from this flush when it is there, otherwise the loaded row."""
    model = _SPOT_MODELS[level]
    for obj in list(session.new) + list(session.dirty) + list(session.deleted):
        if isinstance(obj, model) and obj.id == spot_id:
            return obj
    return session.get(model, spot_id)


def _spot_delta(session: Session, level: str, spot_id, gym: bool) -> int:
    """Points for one crag, sector, or area.

    A description and a portrait image count in every mode. The spot pin and
    a parking pin count only outdoors.
    """
    spot = _spot_object(session, level, spot_id)
    if spot is None:
        return 0
    state = inspect(spot)
    if state.pending:
        before_published = False
        after_published = _is_published_now(spot)
        before_description = False
        after_description = has_text(spot.description) or has_text(spot.short_description)
        before_image = False
        after_image = spot.portrait_image_id is not None
        description_changed = True
        image_changed = True
    elif state.deleted:
        before_published = is_published(spot.publication_status)
        after_published = False
        before_description = has_text(spot.description) or has_text(spot.short_description)
        after_description = False
        before_image = spot.portrait_image_id is not None
        after_image = False
        description_changed = True
        image_changed = True
    else:
        before_published = is_published(_value_before(spot, "publication_status"))
        after_published = is_published(spot.publication_status)
        before_description = has_text(_text_or_empty(_value_before(spot, "description"))) or has_text(
            _text_or_empty(_value_before(spot, "short_description"))
        )
        after_description = has_text(spot.description) or has_text(spot.short_description)
        before_image_id = _value_before(spot, "portrait_image_id")
        before_image = before_image_id is not None and before_image_id is not _MISSING
        after_image = spot.portrait_image_id is not None
        description_changed = _changed(spot, "description", "short_description")
        image_changed = _changed(spot, "portrait_image_id")

    fk = _SPOT_FK[level]
    gps_type = _GPS_TYPE[level]

    def match_type(expected: str):
        def match(marker: MapMarker, before: bool) -> bool:
            attr = fk
            if before and not inspect(marker).pending:
                target = _value_before(marker, attr)
                marker_type = _value_before(marker, "type")
                if target is _MISSING:
                    target = getattr(marker, attr)
                if marker_type is _MISSING:
                    marker_type = marker.type
                return target == spot_id and _enum_value(marker_type) == expected
            hosts = _marker_host_ids(session, marker, attr, level, _SPOT_MODELS[level])
            return spot_id in hosts and _enum_value(marker.type) == expected

        return match

    before_gps, after_gps, gps_changed = _presence(
        session,
        f"SELECT id, lat, lng, type FROM map_markers WHERE {fk} = :spot_id",
        {"spot_id": spot_id},
        match_type(gps_type),
        gps_type,
    )
    before_parking, after_parking, parking_changed = _presence(
        session,
        f"SELECT id, lat, lng, type FROM map_markers WHERE {fk} = :spot_id",
        {"spot_id": spot_id},
        match_type("PARKING"),
        "PARKING",
    )
    if state.deleted:
        after_gps = False
        after_parking = False
    delta = publish_delta(before_published, after_published)
    delta += gate_delta(
        before_published and before_description,
        after_published and after_description,
        description_changed,
        SPOT_DESCRIPTION,
    )
    delta += gate_delta(
        before_published and before_image,
        after_published and after_image,
        image_changed,
        SPOT_IMAGE,
    )
    gps_points = 0 if gym else SPOT_GPS
    parking_points = 0 if gym else SPOT_PARKING
    delta += gate_delta(before_published and before_gps, after_published and after_gps, gps_changed, gps_points)
    delta += gate_delta(
        before_published and before_parking,
        after_published and after_parking,
        parking_changed,
        parking_points,
    )
    return delta


def _text_or_empty(value) -> str:
    """Text for a column that had no previous value."""
    if value is _MISSING or value is None:
        return ""
    return value
