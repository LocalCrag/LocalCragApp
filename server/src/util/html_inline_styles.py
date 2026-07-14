"""Helpers for normalizing HTML produced by WYSIWYG editors."""

import re
from typing import Optional

_STYLE_ATTR_RE = re.compile(
    r'\sstyle=(["\'])(.*?)\1',
    re.IGNORECASE | re.DOTALL,
)
_COLOR_ATTR_RE = re.compile(
    r'\scolor=(["\'])[^"\']*\1',
    re.IGNORECASE,
)
_FONT_OPEN_RE = re.compile(r"<font\b[^>]*>", re.IGNORECASE)
_FONT_CLOSE_RE = re.compile(r"</font>", re.IGNORECASE)

_COLOR_STYLE_NAMES = frozenset({"color", "background-color", "background"})


def _clean_style_value(style: str) -> str:
    kept = []
    for declaration in style.split(";"):
        declaration = declaration.strip()
        if not declaration or ":" not in declaration:
            continue
        name, _value = declaration.split(":", 1)
        if name.strip().lower() in _COLOR_STYLE_NAMES:
            continue
        kept.append(declaration)
    return "; ".join(kept)


def strip_wysiwyg_inline_colors(html: Optional[str]) -> Optional[str]:
    """
    Remove inline text/background colors from HTML (e.g. Quill toolbar formatting).

    Preserves other inline styles (alignment, font-weight, etc.).
    """
    if not html:
        return html

    def _replace_style(match: re.Match[str]) -> str:
        quote = match.group(1)
        cleaned = _clean_style_value(match.group(2))
        if not cleaned:
            return ""
        return f" style={quote}{cleaned}{quote}"

    result = _STYLE_ATTR_RE.sub(_replace_style, html)
    result = _COLOR_ATTR_RE.sub("", result)
    result = _FONT_OPEN_RE.sub("", result)
    result = _FONT_CLOSE_RE.sub("", result)
    return result


def sanitize_wysiwyg_html(html: Optional[str]) -> Optional[str]:
    """Normalize WYSIWYG HTML before persistence (strip inline colors, bucket placeholders)."""
    from util.bucket_placeholders import replace_live_bucket_urls_with_placeholder

    return replace_live_bucket_urls_with_placeholder(strip_wysiwyg_inline_colors(html))
