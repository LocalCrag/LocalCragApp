"""Disk usage of stored files, grouped for the admin panel."""

import json
import logging
import re
import urllib.error
import urllib.request

import sqlalchemy as sa
from flask import current_app

logger = logging.getLogger(__name__)

_DISK_SPACE_UNITS = {
    "": 1,
    "B": 1,
    "K": 1000,
    "KB": 1000,
    "M": 1000**2,
    "MB": 1000**2,
    "G": 1000**3,
    "GB": 1000**3,
    "T": 1000**4,
    "TB": 1000**4,
    "KI": 1024,
    "KIB": 1024,
    "MI": 1024**2,
    "MIB": 1024**2,
    "GI": 1024**3,
    "GIB": 1024**3,
    "TI": 1024**4,
    "TIB": 1024**4,
}
_DISK_SPACE_PATTERN = re.compile(r"(\d+(?:\.\d+)?)\s*([A-Za-z]*)")

# A file is counted once. Videos win over gallery, gallery over topo images
# and the header images of crags, sectors, areas, and regions. Everything
# else, including avatars, is "other".
_CATEGORY_BYTES = sa.text(
    """
    WITH video_ids AS (
        SELECT DISTINCT file_id
        FROM videos
        WHERE file_id IS NOT NULL
    ),
    gallery_ids AS (
        SELECT file_id FROM gallery_images
    ),
    topo_ids AS (
        SELECT file_id FROM topo_images
        UNION
        SELECT portrait_image_id FROM crags WHERE portrait_image_id IS NOT NULL
        UNION
        SELECT portrait_image_id FROM sectors WHERE portrait_image_id IS NOT NULL
        UNION
        SELECT portrait_image_id FROM areas WHERE portrait_image_id IS NOT NULL
        UNION
        SELECT image_id FROM regions WHERE image_id IS NOT NULL
    )
    SELECT
        COALESCE(SUM(files.file_size) FILTER (
            WHERE files.id IN (SELECT file_id FROM video_ids)
        ), 0) AS videos,
        COALESCE(SUM(files.file_size) FILTER (
            WHERE files.id NOT IN (SELECT file_id FROM video_ids)
              AND files.id IN (SELECT file_id FROM gallery_ids)
        ), 0) AS gallery_images,
        COALESCE(SUM(files.file_size) FILTER (
            WHERE files.id NOT IN (SELECT file_id FROM video_ids)
              AND files.id NOT IN (SELECT file_id FROM gallery_ids)
              AND files.id IN (SELECT file_id FROM topo_ids)
        ), 0) AS topo_images,
        COALESCE(SUM(files.file_size) FILTER (
            WHERE files.id NOT IN (SELECT file_id FROM video_ids)
              AND files.id NOT IN (SELECT file_id FROM gallery_ids)
              AND files.id NOT IN (SELECT file_id FROM topo_ids)
        ), 0) AS other
    FROM files
    """
)


def category_bytes(connection) -> dict[str, int]:
    row = connection.execute(_CATEGORY_BYTES).mappings().one()
    return {
        "videos": int(row["videos"]),
        "galleryImages": int(row["gallery_images"]),
        "topoImages": int(row["topo_images"]),
        "other": int(row["other"]),
    }


def capacity_bytes_from_status(payload) -> int | None:
    """Total data-disk bytes from a SeaweedFS volume `/status` response."""
    if not isinstance(payload, dict):
        return None
    disks = payload.get("DiskStatuses")
    if not isinstance(disks, list) or not disks:
        return None
    total = 0
    for disk in disks:
        if not isinstance(disk, dict) or "all" not in disk:
            return None
        total += int(disk["all"])
    return total


def parse_disk_space(value) -> int | None:
    """Bytes from a count or a size such as ``100Gi`` or ``100GB``."""
    if value is None:
        return None
    match = _DISK_SPACE_PATTERN.fullmatch(str(value).strip())
    if match is None:
        return None
    unit = match.group(2).upper()
    if unit not in _DISK_SPACE_UNITS:
        return None
    size = int(float(match.group(1)) * _DISK_SPACE_UNITS[unit])
    if size <= 0:
        return None
    return size


def storage_capacity_bytes() -> int | None:
    """Disk size for the admin bar.

    Kubernetes with SeaweedFS reports the data disk. Other installations can
    set ``STORAGE_DISK_SPACE``. Neither value is consulted when a file is
    uploaded; the object store accepts or rejects that write itself.
    """
    url = current_app.config.get("STORAGE_CAPACITY_URL")
    if url:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                payload = json.load(response)
        except (OSError, urllib.error.URLError, ValueError, json.JSONDecodeError):
            logger.warning("Could not read storage capacity from %s", url)
            return None
        return capacity_bytes_from_status(payload)

    configured = parse_disk_space(current_app.config.get("STORAGE_DISK_SPACE"))
    if current_app.config.get("STORAGE_DISK_SPACE") and configured is None:
        logger.warning("STORAGE_DISK_SPACE %r is not a disk size", current_app.config.get("STORAGE_DISK_SPACE"))
    return configured
