"""Helpers for the rules emphasizment feature (title + read-status reset timestamp)."""

import datetime
from typing import Optional

import pytz


def normalize_rules_title(raw_title: Optional[str]) -> Optional[str]:
    """Normalizes a moderator-supplied rules title: trims whitespace, empty becomes None."""
    if raw_title is None:
        return None
    stripped = raw_title.strip()
    return stripped or None


def apply_rules_emphasis(entity, sanitized_rules: Optional[str], raw_rules_title: Optional[str], is_create: bool):
    """
    Assigns `rules` + `rules_title` on `entity` and advances `rules_updated_at` only when
    the sanitized rules HTML changed (or, on create, when rules are non-empty). Title-only
    changes do not reset read status.
    """
    normalized_title = normalize_rules_title(raw_rules_title)

    if is_create:
        rules_changed = bool(sanitized_rules)
    else:
        rules_changed = sanitized_rules != entity.rules

    entity.rules = sanitized_rules
    entity.rules_title = normalized_title
    if rules_changed:
        entity.rules_updated_at = datetime.datetime.now(pytz.utc)
