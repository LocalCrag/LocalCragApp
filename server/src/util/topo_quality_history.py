"""Weekly quality snapshots and the moderator points summary.

Quality percent is computed from the live topo, so the chart can only show
weeks recorded after this feature. Point awards are stored as they happen.
The running total on the user is unchanged and still includes everything
earned before tracking started. The weekly chart shows only the tracked awards.
"""

from __future__ import annotations

import datetime
import json

import pytz
from sqlalchemy.exc import IntegrityError

from extensions import db
from models.crag import Crag
from models.enums.notification_type_enum import NotificationTypeEnum
from models.enums.publication_status_enum import PublicationStatusEnum
from models.instance_settings import InstanceSettings
from models.topo_point_event import TopoPointEvent
from models.topo_quality_snapshot import TopoQualitySnapshot
from models.topo_week_summary import TopoWeekSummary
from models.user import User
from util.instance_timezone import get_instance_timezone_name, instance_local_date
from util.notifications import create_notification_for_user
from util.topo_quality_data import load_quality_snapshot
from util.topo_quality_score import build_tree, scope_for, score_scope

MESSAGE_LIMIT = 2000
REGION_SCOPE = "region"


def week_start(day: datetime.date) -> datetime.date:
    return day - datetime.timedelta(days=day.weekday())


def previous_week_start(day: datetime.date) -> datetime.date:
    return week_start(day) - datetime.timedelta(days=7)


def _as_utc(moment: datetime.datetime) -> datetime.datetime:
    if moment.tzinfo is None:
        return pytz.utc.localize(moment)
    return moment.astimezone(pytz.utc)


def event_week_start(moment: datetime.datetime) -> datetime.date:
    tz = pytz.timezone(get_instance_timezone_name())
    local = _as_utc(moment).astimezone(tz)
    return week_start(local.date())


def record_quality_snapshot(day: datetime.date | None = None) -> datetime.date:
    """Store this week's quality for the region and each crag.

    Calling it again in the same week refreshes the open week. Secrets stay
    in the figure: the trends tab is for moderators, who can see them.
    """
    today = day or instance_local_date()
    start = week_start(today)
    settings = InstanceSettings.return_it()
    gym = bool(settings.gym_mode) if settings is not None else False
    region_name, spots, lines, topos = load_quality_snapshot(False, gym)
    tree = build_tree(region_name, spots, lines, topos, gym)
    _upsert_snapshot(start, REGION_SCOPE, tree["region"]["name"] or "", tree["region"])
    for crag in spots:
        if crag.level != "crag":
            continue
        scoped_spots, scoped_lines, scoped_topos, _target = scope_for("crag", crag.id, spots, lines, topos)
        summary = score_scope(scoped_spots, scoped_lines, scoped_topos, gym)
        _upsert_snapshot(start, crag.id, crag.name, summary)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
    return start


def _upsert_snapshot(start: datetime.date, scope_key: str, name: str, summary: dict) -> None:
    row = TopoQualitySnapshot.query.filter_by(week_start=start, scope_key=scope_key).first()
    if row is None:
        row = TopoQualitySnapshot(week_start=start, scope_key=scope_key)
        db.session.add(row)
    row.name = (name or "")[:120]
    row.percent = int(summary["percent"])
    row.earned = int(summary["earned"])
    row.max_points = int(summary["max"])
    row.bonus = int(summary["bonus"])


def quality_history() -> dict:
    record_quality_snapshot()
    rows = TopoQualitySnapshot.query.order_by(
        TopoQualitySnapshot.week_start.asc(), TopoQualitySnapshot.name.asc()
    ).all()
    weeks = []
    seen_weeks = set()
    for row in rows:
        key = row.week_start.isoformat()
        if key not in seen_weeks:
            seen_weeks.add(key)
            weeks.append(key)
    week_index = {key: index for index, key in enumerate(weeks)}
    by_scope: dict[str, list] = {}
    names: dict[str, str] = {}
    for row in rows:
        series = by_scope.setdefault(row.scope_key, [None] * len(weeks))
        series[week_index[row.week_start.isoformat()]] = row.percent
        names[row.scope_key] = row.name
    crags = (
        Crag.query.filter(Crag.publication_status == PublicationStatusEnum.PUBLISHED)
        .order_by(Crag.order_index.asc(), Crag.name.asc())
        .all()
    )
    scopes = [{"key": REGION_SCOPE, "name": names.get(REGION_SCOPE) or ""}]
    known = {scope["key"] for scope in scopes}
    for crag in crags:
        key = str(crag.id)
        if key in known:
            continue
        scopes.append({"key": key, "name": crag.name})
        by_scope.setdefault(key, [None] * len(weeks))
    return {"scopes": scopes, "weeks": weeks, "series": by_scope}


def points_history() -> dict:
    """Weekly points for moderators, from the first tracked award through this week.

    Opening balances are the pre-tracking ranking total and are not a week.
    """
    events = (
        TopoPointEvent.query.filter(TopoPointEvent.opening_balance.is_(False))
        .order_by(TopoPointEvent.time_created.asc())
        .all()
    )
    moderators = User.query.filter(User.moderator.is_(True)).order_by(User.firstname.asc(), User.lastname.asc()).all()
    moderator_ids = {str(user.id) for user in moderators}
    buckets: dict[str, dict[datetime.date, int]] = {}
    weeks = set()
    for event in events:
        user_id = str(event.user_id)
        if user_id not in moderator_ids or not event.points:
            continue
        start = event_week_start(event.time_created)
        weeks.add(start)
        user_weeks = buckets.setdefault(user_id, {})
        user_weeks[start] = user_weeks.get(start, 0) + int(event.points)
    if not weeks:
        return {"weeks": [], "series": []}
    ordered = []
    cursor = min(weeks)
    last = max(weeks)
    while cursor <= last:
        ordered.append(cursor)
        cursor += datetime.timedelta(days=7)
    series = []
    for user in moderators:
        user_id = str(user.id)
        if user_id not in buckets:
            continue
        points = [buckets[user_id].get(start, 0) for start in ordered]
        series.append({"user": user, "points": points, "total": sum(points)})
    series.sort(key=lambda row: (-row["total"], _user_label(row["user"]).lower()))
    return {
        "weeks": [start.isoformat() for start in ordered],
        "series": series,
    }


def send_previous_week_summary(today: datetime.date | None = None) -> int:
    """Tell every moderator who scored how many points in the finished week.

    Returns the number of notifications created. A disabled game or a week
    that was already handled creates none. A quiet week is marked handled
    without a notification.
    """
    day = today or instance_local_date()
    start = previous_week_start(day)
    if TopoWeekSummary.query.filter_by(week_start=start).first() is not None:
        return 0
    settings = InstanceSettings.return_it()
    if settings is None or not settings.moderator_game_enabled:
        return 0
    totals = _moderator_points_for_week(start)
    now = datetime.datetime.now(pytz.utc)
    summary = TopoWeekSummary(week_start=start, notified_at=now)
    db.session.add(summary)
    if not totals:
        db.session.commit()
        return 0
    message = _summary_message(start, totals)
    moderators = User.query.filter(User.moderator.is_(True)).all()
    created = 0
    for moderator in moderators:
        db.session.add(
            create_notification_for_user(
                moderator.id,
                NotificationTypeEnum.TOPO_POINTS_WEEKLY,
                message=message,
            )
        )
        created += 1
    db.session.commit()
    return created


def run_weekly_maintenance(today: datetime.date | None = None) -> dict:
    """Refresh this week's quality snapshot and send the previous week's summary.

    The scheduler calls this every day. The summary is sent at most once: a
    finished week stays unmarked until the game is on and this succeeds, so a
    missed Monday is caught on a later day of that same week.
    """
    day = today or instance_local_date()
    record_quality_snapshot(day)
    notified = send_previous_week_summary(day)
    return {"week": week_start(day).isoformat(), "notifications": notified}


def clear_topo_game_history() -> None:
    db.session.query(TopoPointEvent).delete()
    db.session.query(TopoQualitySnapshot).delete()
    db.session.query(TopoWeekSummary).delete()


def _moderator_points_for_week(start: datetime.date) -> list[tuple[str, int]]:
    moderators = {str(user.id): user for user in User.query.filter(User.moderator.is_(True)).all()}
    totals: dict[str, int] = {}
    for event in TopoPointEvent.query.filter(TopoPointEvent.opening_balance.is_(False)).all():
        if event_week_start(event.time_created) != start:
            continue
        user_id = str(event.user_id)
        if user_id not in moderators:
            continue
        totals[user_id] = totals.get(user_id, 0) + int(event.points or 0)
    rows = [(_user_label(moderators[user_id]), points) for user_id, points in totals.items() if points > 0]
    rows.sort(key=lambda row: (-row[1], row[0].lower()))
    return rows


def _summary_message(start: datetime.date, rows: list[tuple[str, int]]) -> str:
    payload_rows = [{"name": name, "points": points} for name, points in rows]
    while True:
        text = json.dumps({"week": start.isoformat(), "rows": payload_rows}, ensure_ascii=False)
        if len(text) <= MESSAGE_LIMIT or not payload_rows:
            return text[:MESSAGE_LIMIT]
        payload_rows = payload_rows[:-1]


def _user_label(user: User) -> str:
    name = f"{user.firstname or ''} {user.lastname or ''}".strip()
    return name or user.email or ""
