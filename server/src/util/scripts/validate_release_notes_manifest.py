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
import sys
from pathlib import Path

from jsonschema import Draft7Validator


def _server_src_dir() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def _default_paths() -> tuple[Path, Path]:
    base = _server_src_dir()
    return (
        base / "data" / "release_notes_manifest.json",
        base / "data" / "release_notes_manifest.schema.json",
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
    manifest_path, schema_path = _default_paths()
    if not schema_path.is_file():
        print(f"Schema not found: {schema_path}", file=sys.stderr)
        return 1
    if not manifest_path.is_file():
        print(f"Manifest not found: {manifest_path}", file=sys.stderr)
        return 1
    try:
        schema = json.loads(schema_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in schema: {e}", file=sys.stderr)
        return 1
    try:
        instance = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"Invalid JSON in manifest: {e}", file=sys.stderr)
        return 1

    errs = validate_manifest(instance, schema)
    if errs:
        print(f"release_notes_manifest.json validation failed ({manifest_path}):", file=sys.stderr)
        for msg in errs:
            print(f"  - {msg}", file=sys.stderr)
        return 1
    print(f"OK: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
