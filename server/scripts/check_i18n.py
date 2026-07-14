#!/usr/bin/env python3
"""Validate backend i18n Python translation dicts under server/src/i18n/.

Run from server/src with PYTHONPATH=. (see i18n-extract-and-check workflow):
    pipenv run python ../scripts/check_i18n.py
"""

from __future__ import annotations

import importlib
import logging
from pathlib import Path

from i18n.mail_common import merge_mail_translations
from util.logging_config import configure_standalone_logging
from util.validators import ALLOWED_LANGUAGES

I18N_DIR = Path("i18n")
logger = logging.getLogger(__name__)


def _key_mismatch_errors(source_dict: dict, locales: set[str]) -> list[str]:
    """Report keys that differ between locale dicts."""
    key_sets = {locale: set(source_dict[locale].keys()) for locale in sorted(locales)}
    if len(key_sets) < 2:
        return []

    all_keys = set.union(*key_sets.values())
    common_keys = set.intersection(*key_sets.values())
    if all_keys == common_keys:
        return []

    errors: list[str] = []
    for locale, keys in key_sets.items():
        missing_keys = sorted(all_keys - keys)
        extra_keys = sorted(keys - common_keys)
        if missing_keys:
            errors.append(f"[{locale}] missing keys: {', '.join(missing_keys)}")
        if extra_keys:
            errors.append(f"[{locale}] extra keys: {', '.join(extra_keys)}")
    return errors


def _load_sources():
    if not I18N_DIR.is_dir():
        raise SystemExit("i18n directory not found. Run this script from server/src with PYTHONPATH=.")

    sources: list[tuple[str, dict, bool]] = []
    for path in sorted(I18N_DIR.glob("*.py")):
        name = path.stem
        if name.startswith("_"):
            continue
        module = importlib.import_module(f"i18n.{name}")
        if not hasattr(module, name):
            raise SystemExit(f"{path}: expected dict export '{name}'")
        source_dict = getattr(module, name)
        if not isinstance(source_dict, dict):
            raise SystemExit(f"{path}: '{name}' must be a dict")
        sources.append((name, source_dict, name != "mail_common"))
    return sources, merge_mail_translations, ALLOWED_LANGUAGES


def _check_source(
    source_name: str,
    source_dict: dict,
    *,
    allowed_languages: set[str],
    merge_common: bool,
    merge_mail_translations,
) -> list[str]:
    errors: list[str] = []

    locales = set(source_dict.keys())
    missing_locales = sorted(allowed_languages - locales)
    unexpected_locales = sorted(locales - allowed_languages)
    if missing_locales:
        errors.append(f"missing locales: {', '.join(missing_locales)}")
    if unexpected_locales:
        errors.append(f"unexpected locales: {', '.join(unexpected_locales)}")

    present_locales = locales & allowed_languages
    errors.extend(_key_mismatch_errors(source_dict, present_locales))

    for locale in sorted(present_locales):
        translations = source_dict[locale]
        if merge_common:
            translations = merge_mail_translations(locale, translations)

        empty_keys = sorted(key for key, value in translations.items() if value == "")
        if empty_keys:
            errors.append(f"[{locale}] empty strings: {', '.join(empty_keys)}")

    return errors


def main() -> int:
    configure_standalone_logging()
    sources, merge_mail_translations_fn, allowed_languages = _load_sources()
    failures: list[tuple[str, list[str]]] = []

    for source_name, source_dict, merge_common in sources:
        source_errors = _check_source(
            source_name,
            source_dict,
            allowed_languages=allowed_languages,
            merge_common=merge_common,
            merge_mail_translations=merge_mail_translations_fn,
        )
        if source_errors:
            failures.append((source_name, source_errors))

    if failures:
        logger.error("Backend i18n check failed:")
        for source_name, source_errors in failures:
            for error in source_errors:
                logger.error("- %s: %s", source_name, error)
        logger.error(
            "Please add missing locales/keys and provide translations for every string "
            "(mail templates merge shared strings from mail_common.py)."
        )
        return 1

    logger.info(
        "Backend i18n OK (%s source(s), locales: %s).",
        len(sources),
        ", ".join(sorted(allowed_languages)),
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
