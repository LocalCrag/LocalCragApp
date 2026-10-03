"""Object-storage keys for a File row, and deletion of those objects.

Image uploads store the original plus size variants. Variant keys follow the
client URL rule: the extension is replaced with ``_<size>.<ext>`` (for example
``abc.jpeg`` -> ``abc_xs.jpeg``).
"""

import logging
from collections.abc import Iterable, Mapping

from flask import current_app

from uploader.do_s3 import get_s3_client

logger = logging.getLogger(__name__)

THUMBNAIL_SIZES = ("xs", "s", "m", "l", "xl")
_DELETE_BATCH_SIZE = 1000


def thumbnail_storage_key(filename: str, size: str) -> str:
    stem, dot, extension = filename.rpartition(".")
    if not dot:
        return f"{filename}_{size}"
    return f"{stem}_{size}.{extension}"


def referenced_storage_keys(rows: Iterable[Mapping | object]) -> set[str]:
    """Keys that must stay because a files row still points at them."""
    keys: set[str] = set()
    for row in rows:
        filename = _row_value(row, "filename")
        if not filename:
            continue
        keys.add(filename)
        for size in THUMBNAIL_SIZES:
            if _row_value(row, f"thumbnail_{size}"):
                keys.add(thumbnail_storage_key(filename, size))
    return keys


def storage_keys_for_deleted_file(filename: str | None) -> set[str]:
    """Original key plus every thumbnail variant for a removed files row.

    Missing variants are ignored by object storage. Deleting all sizes covers
    rows whose thumbnail flags do not match what was actually uploaded.
    """
    if not filename:
        return set()
    keys = {filename}
    keys.update(thumbnail_storage_key(filename, size) for size in THUMBNAIL_SIZES)
    return keys


def delete_storage_keys(keys: Iterable[str]) -> int:
    """Delete the given keys from the configured bucket. Missing keys are fine."""
    unique_keys = list(dict.fromkeys(key for key in keys if key))
    if not unique_keys:
        return 0

    bucket = current_app.config.get("S3_BUCKET")
    if not bucket:
        raise RuntimeError("S3_BUCKET is not configured.")

    client = get_s3_client()
    for start in range(0, len(unique_keys), _DELETE_BATCH_SIZE):
        end = start + _DELETE_BATCH_SIZE
        chunk = unique_keys[start:end]
        response = client.delete_objects(
            Bucket=bucket,
            Delete={"Objects": [{"Key": key} for key in chunk], "Quiet": True},
        )
        errors = response.get("Errors") or []
        if errors:
            failed = ", ".join(f"{error.get('Key')} ({error.get('Code')})" for error in errors)
            raise RuntimeError(f"Failed to delete storage objects: {failed}")
    return len(unique_keys)


def delete_unreferenced_storage_objects(referenced_keys: set[str]) -> int:
    """Delete bucket objects that no files row still references."""
    bucket = current_app.config.get("S3_BUCKET")
    if not bucket:
        logger.warning("Skipping orphan storage cleanup because S3_BUCKET is not configured.")
        return 0

    client = get_s3_client()
    orphans: list[str] = []
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        for obj in page.get("Contents") or []:
            key = obj["Key"]
            if key not in referenced_keys:
                orphans.append(key)

    deleted = delete_storage_keys(orphans)
    logger.info("Deleted %s orphan storage object(s).", deleted)
    return deleted


def _row_value(row, name: str):
    if isinstance(row, Mapping):
        return row.get(name)
    return getattr(row, name)
