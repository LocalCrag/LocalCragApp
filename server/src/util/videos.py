"""Line and ascent video links.

External videos are YouTube, Vimeo, or Instagram. Line videos may also be an
uploaded file when the instance allows it. An ascent has at most one video,
and that video is a link.
The client parser in `video-source.ts` mirrors the host rules here.
"""

from __future__ import annotations

import re
import uuid
from urllib.parse import parse_qs, urlparse

from extensions import db
from models.file import File
from models.instance_settings import InstanceSettings

VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".ogg", ".m4v"}
MAX_START_SECONDS = 24 * 60 * 60

_YOUTUBE_ID = re.compile(r"^[A-Za-z0-9_-]{11}$")
_IG_CODE = re.compile(r"^[A-Za-z0-9_-]{5,}$")
_CLOCK = re.compile(r"^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$")


class VideoValidationError(ValueError):
    pass


def video_uploads_enabled() -> bool:
    settings = InstanceSettings.return_it()
    return bool(settings and settings.video_uploads_enabled)


def provider_for_url(url: str | None) -> str | None:
    """Return youtube, vimeo, or instagram when the URL is a playable link."""
    parsed = _parse_http_url(url)
    if parsed is None:
        return None
    host = (parsed.hostname or "").lower()
    if _youtube_id(parsed, host):
        return "youtube"
    if _vimeo_id(parsed, host):
        return "vimeo"
    if _instagram_code(parsed, host):
        return "instagram"
    return None


def normalize_line_videos(videos, existing=None, uploads_enabled: bool | None = None):
    """Store line videos. Request shape is checked by webargs.

    A URL that is not YouTube, Vimeo, or Instagram is kept only when it is already on the line.
    """
    if videos is None:
        return None

    if uploads_enabled is None:
        uploads_enabled = video_uploads_enabled()
    existing_items = [item for item in (existing or []) if isinstance(item, dict)]
    existing_urls = {(item.get("url") or "").strip() for item in existing_items}
    existing_file_ids = {str(item.get("fileId")) for item in existing_items if item.get("fileId")}

    normalized = []
    for item in videos:
        title = item["title"].strip()
        file_id = item.get("fileId")
        if file_id or item.get("source") == "upload":
            start = _clean_start(item.get("startSeconds"))
            normalized.append(_normalize_upload(file_id, title, start, existing_file_ids, uploads_enabled))
            continue
        url = (item.get("url") or "").strip()
        provider = provider_for_url(url)
        if provider is None:
            if url not in existing_urls:
                raise VideoValidationError("Video URL must be a YouTube, Vimeo, or Instagram link.")
            provider = "link"
        normalized.append(
            {
                "url": url,
                "title": title,
                "source": provider,
                "startSeconds": _stored_start(provider, item.get("startSeconds")),
            }
        )
    return normalized


def normalize_ascent_video(video) -> dict | None:
    """One external link, or None when the ascent has no video."""
    if video is None:
        return None
    return normalize_ascent_videos([video])[0]


def normalize_ascent_videos(videos) -> list:
    """Store ascent links. Request shape is checked by webargs."""
    if not videos:
        return []
    normalized = []
    for item in videos:
        url = (item.get("url") or "").strip()
        provider = provider_for_url(url)
        if provider is None:
            raise VideoValidationError("Video URL must be a YouTube, Vimeo, or Instagram link.")
        title = (item.get("title") or "Video").strip() or "Video"
        normalized.append(
            {
                "url": url,
                "title": title,
                "source": provider,
                "startSeconds": _stored_start(provider, item.get("startSeconds")),
            }
        )
    return normalized


def moderate_ascent_video(existing, incoming) -> dict | None:
    """Moderators may drop the ascent video or change the start time. They cannot add a link."""
    if incoming is None:
        return None
    if not existing or (existing.get("url") or "").strip() != (incoming.get("url") or "").strip():
        raise VideoValidationError("Moderators can only remove an ascent video or change the start time.")
    provider = existing.get("source") or provider_for_url(existing.get("url")) or "link"
    return {
        "url": existing.get("url"),
        "title": existing.get("title") or "Video",
        "source": provider,
        "startSeconds": _stored_start(provider, incoming.get("startSeconds")),
    }


def _normalize_upload(file_id, title: str, start, existing_file_ids: set[str], uploads_enabled: bool) -> dict:
    parsed_id = uuid.UUID(str(file_id))
    file_key = str(parsed_id)
    if not uploads_enabled and file_key not in existing_file_ids:
        raise VideoValidationError("Video uploads are disabled.")
    file = db.session.get(File, parsed_id)
    if file is None or not _is_video_filename(file.filename):
        raise VideoValidationError("Uploaded file is not a video.")
    return {
        "url": file.filename_with_host,
        "title": title,
        "source": "upload",
        "fileId": file_key,
        "startSeconds": start,
    }


def _is_video_filename(filename: str | None) -> bool:
    if not filename or "." not in filename:
        return False
    return filename.rsplit(".", 1)[-1].lower() in {extension[1:] for extension in VIDEO_EXTENSIONS}


def _stored_start(provider: str | None, value):
    """Instagram embeds cannot seek, so a start time is never stored."""
    if provider == "instagram":
        return None
    return _clean_start(value)


def _clean_start(value):
    if value is None or value == "":
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise VideoValidationError("Start time must be a whole number of seconds.")
    if value < 0 or value > MAX_START_SECONDS:
        raise VideoValidationError("Start time must be a whole number of seconds.")
    if value == 0:
        return None
    return value


def _parse_http_url(url: str | None):
    if not url or not isinstance(url, str):
        return None
    parsed = urlparse(url.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return None
    return parsed


def _is_youtube_watch_host(host: str) -> bool:
    """youtube.com and youtube-nocookie.com, including subdomains.

    The nocookie suffix needs a leading dot. Otherwise evil-youtube-nocookie.com matches.
    """
    return (
        host == "youtube.com"
        or host.endswith(".youtube.com")
        or host == "youtube-nocookie.com"
        or host.endswith(".youtube-nocookie.com")
    )


def _youtube_id(parsed, host: str) -> str | None:
    if host in {"youtu.be", "www.youtu.be"}:
        parts = [part for part in parsed.path.split("/") if part]
        return parts[0] if parts and _YOUTUBE_ID.match(parts[0]) else None
    if not _is_youtube_watch_host(host):
        return None
    if parsed.path == "/watch":
        video_id = parse_qs(parsed.query).get("v", [None])[0]
        return video_id if video_id and _YOUTUBE_ID.match(video_id) else None
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) >= 2 and parts[0] in {"embed", "shorts", "live", "v"} and _YOUTUBE_ID.match(parts[1]):
        return parts[1]
    return None


def _vimeo_id(parsed, host: str) -> str | None:
    if host not in {"vimeo.com", "www.vimeo.com", "player.vimeo.com"}:
        return None
    match = re.search(r"(\d{6,12})", parsed.path)
    return match.group(1) if match else None


def _instagram_code(parsed, host: str) -> str | None:
    if host not in {"instagram.com", "www.instagram.com", "m.instagram.com"}:
        return None
    parts = [part for part in parsed.path.split("/") if part]
    for index, part in enumerate(parts):
        if part in {"p", "reel", "reels", "tv"} and index + 1 < len(parts) and _IG_CODE.match(parts[index + 1]):
            return parts[index + 1]
    return None
