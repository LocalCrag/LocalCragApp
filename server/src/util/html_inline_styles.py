"""Helpers for normalizing HTML produced by WYSIWYG editors."""

import re
from typing import Optional

from util.bucket_placeholders import replace_live_bucket_urls_with_placeholder

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

_COLOR_STYLE_NAMES = frozenset({"background-color", "background"})
_FONT_SIZE_STYLE_NAMES = frozenset({"font-size", "font"})
_HEADING_PAIR_RE = re.compile(
    r"<h([1-6])(\s[^>]*)?>(.*?)</h\1\s*>",
    re.IGNORECASE | re.DOTALL,
)
_FONT_PAIR_RE = re.compile(
    r"<font\b([^>]*)>((?:(?!</?font\b).)*)</font>",
    re.IGNORECASE | re.DOTALL,
)
_FONT_SIZE_ATTR_RE = re.compile(
    r"""\ssize\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)""",
    re.IGNORECASE,
)
_FONT_SIZE_HINT_RE = re.compile(
    r"font-size\s*:|\bfont\s*:|<h[1-6]\b|<font\b",
    re.IGNORECASE,
)


def _clean_style_value(style: str) -> str | None:
    """Return a cleaned style, or None when nothing was removed."""
    cleaned, removed = _strip_named_styles(style, _COLOR_STYLE_NAMES)
    if not removed:
        return None
    return cleaned


def strip_wysiwyg_inline_colors(html: Optional[str]) -> Optional[str]:
    """
    Remove pasted background colors from HTML.

    Text color and other inline styles (alignment, font-weight) are kept.
    """
    if not html:
        return html

    def _replace_style(match: re.Match[str]) -> str:
        quote = match.group(1)
        cleaned = _clean_style_value(match.group(2))
        if cleaned is None:
            return match.group(0)
        if not cleaned:
            return ""
        return f" style={quote}{cleaned}{quote}"

    result = _STYLE_ATTR_RE.sub(_replace_style, html)
    result = _COLOR_ATTR_RE.sub("", result)
    result = _FONT_OPEN_RE.sub("", result)
    result = _FONT_CLOSE_RE.sub("", result)
    return result


def replace_wysiwyg_headings_and_font_size(html: Optional[str]) -> Optional[str]:
    """
    Turn headings into bold paragraphs and drop font-size styling.

    `font-size`, the `font` shorthand, and the `<font size>` attribute are
    removed. Other inline styles, including text color and alignment, stay.
    """
    if not html or _FONT_SIZE_HINT_RE.search(html) is None:
        return html

    def _replace_style(match: re.Match[str]) -> str:
        quote = match.group(1)
        cleaned, removed = _strip_named_styles(match.group(2), _FONT_SIZE_STYLE_NAMES)
        if not removed:
            return match.group(0)
        if not cleaned:
            return ""
        return f" style={quote}{cleaned}{quote}"

    def _replace_font(match: re.Match[str]) -> str:
        attrs = _FONT_SIZE_ATTR_RE.sub("", match.group(1))
        inner = match.group(2)
        if attrs == match.group(1):
            return match.group(0)
        if not attrs.strip():
            return inner
        return f"<font{attrs}>{inner}</font>"

    def _replace_heading(match: re.Match[str]) -> str:
        attrs = match.group(2) or ""
        inner = match.group(3)
        if inner.strip():
            inner = f"<strong>{inner}</strong>"
        return f"<p{attrs}>{inner}</p>"

    result = _STYLE_ATTR_RE.sub(_replace_style, html)
    result = _HEADING_PAIR_RE.sub(_replace_heading, result)
    previous = None
    while previous != result:
        previous = result
        result = _FONT_PAIR_RE.sub(_replace_font, result)
    return result


def _strip_named_styles(style: str, names: frozenset[str]) -> tuple[str, bool]:
    kept = []
    removed = False
    for declaration in style.split(";"):
        declaration = declaration.strip()
        if not declaration or ":" not in declaration:
            continue
        name, _value = declaration.split(":", 1)
        if name.strip().lower() in names:
            removed = True
            continue
        kept.append(declaration)
    return "; ".join(kept), removed


def sanitize_wysiwyg_html(html: Optional[str]) -> Optional[str]:
    """Normalize WYSIWYG HTML before persistence."""
    return replace_live_bucket_urls_with_placeholder(strip_wysiwyg_inline_colors(html))
