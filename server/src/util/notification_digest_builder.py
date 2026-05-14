import html

from i18n.notification_digest_mail import notification_digest_mail
from models.area import Area
from models.ascent import Ascent
from models.comment import Comment
from models.crag import Crag
from models.enums.notification_type_enum import NotificationTypeEnum
from models.instance_settings import InstanceSettings
from models.line import Line
from models.notification import Notification
from models.post import Post
from models.region import Region
from models.scale import Scale
from models.sector import Sector
from util.email_helpers import build_comment_action_link, frontend_url


def _target_anchor(href: str, label: str, *, quote: bool = False) -> str:
    """Return an HTML anchor with escaped href and label.

    When ``quote`` is True, wraps the visible label in double quotes.
    """
    safe_href = html.escape(href, quote=True)
    safe_label = html.escape(label)
    visible = f'"{safe_label}"' if quote else safe_label
    return f'<a href="{safe_href}" target="_blank">{visible}</a>'


def build_digest_items(
    notifications: list[Notification],
    digest_i18n: dict[str, str],
) -> list[dict]:
    """Turn pending notifications into digest rows: each ``{"html": ...}`` for the email template.

    FA moderation rows are never merged; other types are grouped by
    ``(type, entity_type, entity_id)`` with a combined count.
    Release-note notifications are filtered out before digest send and are not rendered here.
    """
    instance_settings = InstanceSettings.return_it()
    display_user_grades = bool(instance_settings.display_user_grades) if instance_settings else False
    grade_name_cache: dict[tuple[str, str, int], str | None] = {}
    grouped: dict[tuple, int] = {}
    explicit_items: list[dict] = []
    for notification in notifications:
        if notification.type == NotificationTypeEnum.FA_MODERATION_REMOVED:
            entry = _build_digest_item(
                notification.type,
                notification.entity_type,
                str(notification.entity_id) if notification.entity_id else None,
                1,
                notification=notification,
                digest_i18n=digest_i18n,
                display_user_grades=display_user_grades,
                grade_name_cache=grade_name_cache,
            )
            if entry:
                explicit_items.append(entry)
            continue
        key = (
            notification.type,
            notification.entity_type,
            str(notification.entity_id) if notification.entity_id else None,
        )
        grouped[key] = grouped.get(key, 0) + 1

    items = []
    for (notification_type, entity_type, entity_id), count in grouped.items():
        entry = _build_digest_item(
            notification_type,
            entity_type,
            entity_id,
            count,
            digest_i18n=digest_i18n,
            display_user_grades=display_user_grades,
            grade_name_cache=grade_name_cache,
        )
        if entry:
            items.append(entry)
    return explicit_items + items


def _build_digest_item(
    notification_type: NotificationTypeEnum,
    entity_type: str | None,
    entity_id: str | None,
    count: int,
    notification: Notification | None = None,
    digest_i18n: dict[str, str] | None = None,
    display_user_grades: bool = False,
    grade_name_cache: dict[tuple[str, str, int], str | None] | None = None,
):
    """Render one digest item for a notification type."""
    digest_i18n = digest_i18n or notification_digest_mail["en"]
    grade_name_cache = grade_name_cache or {}
    if notification_type == NotificationTypeEnum.REACTION:
        return _build_reaction_digest_item(
            entity_type,
            entity_id,
            count,
            digest_i18n,
            display_user_grades=display_user_grades,
            grade_name_cache=grade_name_cache,
        )
    if notification_type == NotificationTypeEnum.COMMENT_REPLY:
        comment = Comment.query.filter_by(id=entity_id).first() if entity_id else None
        target_label = _comment_target_label(
            comment,
            display_user_grades=display_user_grades,
            grade_name_cache=grade_name_cache,
            use_region_for_geo_targets=False,
        )
        target = target_label or digest_i18n["view_comment_label"]
        href = build_comment_action_link(comment) if comment else frontend_url("account")
        target_link = _target_anchor(href, target, quote=True)
        comment_reply_text_key = "comment_reply_text_single" if count == 1 else "comment_reply_text"
        return {
            "html": digest_i18n[comment_reply_text_key].format(count=count, target_link=target_link),
        }
    if notification_type == NotificationTypeEnum.FA_MODERATION_REMOVED:
        if entity_type == "ascent" and entity_id:
            ascent = Ascent.query.filter_by(id=entity_id).first()
            if ascent and ascent.line:
                line = ascent.line
                line_link = frontend_url(
                    f"topo/{line.area.sector.crag.slug}/{line.area.sector.slug}/{line.area.slug}/{line.slug}"
                )
                moderator_name = f"{notification.actor.firstname} {notification.actor.lastname}".strip()
                moderator_email = notification.actor.email
                target_link = _target_anchor(line_link, line.name, quote=True)
                return {
                    "html": digest_i18n["fa_removed_text"].format(
                        moderator_name=html.escape(moderator_name),
                        moderator_email=html.escape(moderator_email),
                        target_link=target_link,
                    ),
                }
        return None
    return None


def _build_reaction_digest_item(
    entity_type: str | None,
    entity_id: str | None,
    count: int,
    digest_i18n: dict[str, str],
    *,
    display_user_grades: bool,
    grade_name_cache: dict[tuple[str, str, int], str | None],
):
    """Build a reaction digest row; uses region name for geo comment targets when reacting to a comment."""
    ascent_text_key = "reaction_ascent_text_single" if count == 1 else "reaction_ascent_text"
    comment_text_key = "reaction_comment_text_single" if count == 1 else "reaction_comment_text"
    generic_text_key = "reaction_generic_text_single" if count == 1 else "reaction_generic_text"
    if entity_type == "ascent" and entity_id:
        ascent = Ascent.query.filter_by(id=entity_id).first()
        if ascent and ascent.line:
            line = ascent.line
            line_target = _line_label_with_grade(
                line,
                display_user_grades=display_user_grades,
                grade_name_cache=grade_name_cache,
            )
            line_link = frontend_url(
                f"topo/{line.area.sector.crag.slug}/{line.area.sector.slug}/{line.area.slug}/{line.slug}"
            )
            target_link = _target_anchor(line_link, line_target, quote=True)
            return {
                "html": digest_i18n[ascent_text_key].format(count=count, target_link=target_link),
            }
    if entity_type == "comment" and entity_id:
        comment = Comment.query.filter_by(id=entity_id).first()
        if comment:
            target_label = _comment_target_label(
                comment,
                display_user_grades=display_user_grades,
                grade_name_cache=grade_name_cache,
                use_region_for_geo_targets=True,
            )
            target = target_label or digest_i18n["view_comment_label"]
            href = build_comment_action_link(comment)
            target_link = _target_anchor(href, target, quote=True)
            return {
                "html": digest_i18n[comment_text_key].format(count=count, target_link=target_link),
            }
    acct = frontend_url("account")
    return {
        "html": digest_i18n[generic_text_key].format(count=count)
        + " "
        + _target_anchor(acct, digest_i18n["open_account_label"]),
    }


def _line_label_with_grade(
    line: Line,
    *,
    display_user_grades: bool,
    grade_name_cache: dict[tuple[str, str, int], str | None],
) -> str:
    """Line display name plus grade label (author vs user grade from instance settings)."""
    grade_name = _line_grade_name(line, display_user_grades=display_user_grades, grade_name_cache=grade_name_cache)
    return f"{line.name} {grade_name}" if grade_name else line.name


def _line_grade_name(
    line: Line | None,
    *,
    display_user_grades: bool,
    grade_name_cache: dict[tuple[str, str, int], str | None],
) -> str | None:
    """Resolve the scale grade *name* for a line's stored grade value; uses ``grade_name_cache`` per digest."""
    if not line:
        return None
    grade_value = line.user_grade_value if display_user_grades else line.author_grade_value
    if grade_value is None:
        return None
    line_type = line.type.value if line.type else None
    scale_name = line.grade_scale
    if not line_type or not scale_name:
        return None
    cache_key = (line_type, scale_name, grade_value)
    if cache_key in grade_name_cache:
        return grade_name_cache[cache_key]
    scale = Scale.query.filter_by(type=line.type, name=scale_name).first()
    if not scale:
        grade_name_cache[cache_key] = None
        return None
    grade_name = None
    for grade in scale.grades:
        if grade.get("value") == grade_value:
            grade_name = grade.get("name")
            break
    grade_name_cache[cache_key] = grade_name
    return grade_name


def _comment_target_label(
    comment: Comment | None,
    *,
    display_user_grades: bool,
    grade_name_cache: dict[tuple[str, str, int], str | None],
    use_region_for_geo_targets: bool,
) -> str | None:
    """Human label for what the comment is on (line+grade, post title, area/sector/crag/region).

    When ``use_region_for_geo_targets`` is True (reactions on comments), area/sector/crag use the
    instance region name; when False (replies), use the concrete place name.
    """
    if not comment:
        return None
    obj = comment.object
    if isinstance(obj, Line):
        return _line_label_with_grade(
            obj,
            display_user_grades=display_user_grades,
            grade_name_cache=grade_name_cache,
        )
    if isinstance(obj, Area):
        if use_region_for_geo_targets:
            region = Region.return_it()
            return region.name if region else obj.name
        return obj.name
    if isinstance(obj, Sector):
        if use_region_for_geo_targets:
            region = Region.return_it()
            return region.name if region else obj.name
        return obj.name
    if isinstance(obj, Crag):
        if use_region_for_geo_targets:
            region = Region.return_it()
            return region.name if region else obj.name
        return obj.name
    if isinstance(obj, Region):
        return obj.name
    if isinstance(obj, Post):
        return obj.title
    return None
