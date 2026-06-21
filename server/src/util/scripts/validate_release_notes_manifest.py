#!/usr/bin/env python3
"""
Validate server/src/data/release_notes_manifest.json against
server/src/data/release_notes_manifest.schema.json.

Duplicate ``key`` values are rejected (not expressible in standard JSON Schema).

From repo root with pipenv (``jsonschema`` is a dev dependency)::

  cd server && pipenv install --dev && pipenv run python src/util/scripts/validate_release_notes_manifest.py
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

from jsonschema import Draft7Validator

logger = logging.getLogger(__name__)

_SRC_DIR = Path(__file__).resolve().parent.parent.parent


def _configure_logging() -> None:
    if str(_SRC_DIR) not in sys.path:
        sys.path.insert(0, str(_SRC_DIR))
    from util.logging_config import configure_standalone_logging

    configure_standalone_logging()


def _default_paths() -> tuple[Path, Path]:
    return (
        _SRC_DIR / "data" / "release_notes_manifest.json",
        _SRC_DIR / "data" / "release_notes_manifest.schema.json",
    )


def _duplicate_key_errors(items: object) -> list[str]:
    if not isinstance(items, list):
        return []
    seen: set[str] = set()
    errors: list[str] = []
    for i, row in enumerate(items):
        if not isinstance(row, dict):
            continue
        key = row.get("key")
        if not isinstance(key, str):
            continue
        if key in seen:
            errors.append(f"items[{i}]: duplicate key {key!r}")
        seen.add(key)
    return errors


def validate_manifest(instance: object, schema: object) -> list[str]:
    """Return human-readable errors; empty means valid."""
    errors: list[str] = []
    validator = Draft7Validator(schema)
    for err in sorted(validator.iter_errors(instance), key=lambda e: list(e.path)):
        path = ".".join(str(p) for p in err.absolute_path) or "(root)"
        errors.append(f"{path}: {err.message}")
    if errors:
        return errors
    if not isinstance(instance, dict):
        return errors
    errors.extend(_duplicate_key_errors(instance.get("items")))
    return errors


def main() -> int:
    _configure_logging()
    manifest_path, schema_path = _default_paths()
    if not schema_path.is_file():
        logger.error("Schema not found: %s", schema_path)
        return 1
    if not manifest_path.is_file():
        logger.error("Manifest not found: %s", manifest_path)
        return 1
    try:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in schema: %s", e)
        return 1
    try:
        instance = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in manifest: %s", e)
        return 1

    errs = validate_manifest(instance, schema)
    if errs:
        logger.error("release_notes_manifest.json validation failed (%s):", manifest_path)
        for msg in errs:
            logger.error("  - %s", msg)
        return 1
    logger.info("OK: %s", manifest_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
