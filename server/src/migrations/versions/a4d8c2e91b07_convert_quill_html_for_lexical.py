"""Convert stored Quill HTML into Lexical markup.

Revision ID: a4d8c2e91b07
Revises: b8e1c4a72d09
Create Date: 2026-11-07

"""

import re
from html.parser import HTMLParser
from typing import Optional

import sqlalchemy as sa
from alembic import op

revision = "a4d8c2e91b07"
down_revision = "b8e1c4a72d09"
branch_labels = None
depends_on = None

_WYSIWYG_HTML_COLUMNS = (
    ("areas", "short_description"),
    ("areas", "description"),
    ("crags", "short_description"),
    ("crags", "description"),
    ("crags", "rules"),
    ("lines", "description"),
    ("menu_pages", "text"),
    ("posts", "text"),
    ("regions", "description"),
    ("regions", "rules"),
    ("sectors", "short_description"),
    ("sectors", "description"),
    ("sectors", "rules"),
    ("moderator_tasks", "description"),
    ("topo_images", "description"),
    ("map_markers", "description"),
)

_QUILL_CLASS_RE = re.compile(
    r"ql-(?:align-(?:left|center|right|justify)|indent-\d+|video|ui|direction-(?:ltr|rtl))\b",
    re.IGNORECASE,
)
_ALIGNMENTS = frozenset({"left", "center", "right", "justify"})
_VOID_TAGS = frozenset(
    {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
)
_INDENT_PX = 40


class _Node:
    def __init__(self, tag: str, attrs: list[tuple[str, str | None]]):
        self.tag = tag
        self.attrs = attrs
        self.children: list[_Node | str] = []
        self.list_indent = 0


class _Fragment:
    def __init__(self):
        self.tag = ""
        self.children: list[_Node | str] = []


class _Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.root = _Fragment()
        self.stack: list[_Node | _Fragment] = [self.root]

    def handle_starttag(self, tag, attrs):
        node = _Node(tag, list(attrs))
        self.stack[-1].children.append(node)
        if tag not in _VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].children.append(_Node(tag, list(attrs)))

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            current = self.stack[index]
            if isinstance(current, _Node) and current.tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        if data:
            self.stack[-1].children.append(data)

    def handle_entityref(self, name):
        self.stack[-1].children.append(f"&{name};")

    def handle_charref(self, name):
        self.stack[-1].children.append(f"&#{name};")

    def handle_comment(self, data):
        self.stack[-1].children.append(f"<!--{data}-->")


def _convert_quill_html(html: Optional[str]) -> Optional[str]:
    """
    Rewrite Quill alignment, indent, direction, and video classes.

    Alignment becomes `text-align`. Paragraph indents become Lexical's
    `data-lexical-indent` plus `padding-inline-start`. Indented list items
    become nested lists. HTML without those classes is returned unchanged.
    """
    if not html or _QUILL_CLASS_RE.search(html) is None:
        return html
    parser = _Parser()
    parser.feed(html)
    parser.close()
    _convert_children(parser.root)
    _nest_lists(parser.root)
    return _serialize_children(parser.root.children)


def _convert_children(parent: _Node | _Fragment) -> None:
    kept: list[_Node | str] = []
    for child in parent.children:
        if isinstance(child, str) or _convert_element(child):
            kept.append(child)
            if not isinstance(child, str):
                _convert_children(child)
    parent.children = kept


def _convert_element(node: _Node) -> bool:
    classes = _attr(node, "class").split()
    kept_classes: list[str] = []
    align = None
    indent = None
    direction = None
    quill_ui = False
    for token in classes:
        normalized = token.lower()
        if normalized.startswith("ql-align-") and normalized[9:] in _ALIGNMENTS:
            align = normalized[9:]
        elif normalized.startswith("ql-indent-") and normalized[10:].isdigit():
            indent = int(normalized[10:])
        elif normalized == "ql-ui":
            quill_ui = True
        elif normalized == "ql-direction-rtl":
            direction = "rtl"
        elif normalized == "ql-direction-ltr":
            direction = "ltr"
        elif normalized == "ql-video":
            continue
        else:
            kept_classes.append(token)
    if quill_ui and not kept_classes and _is_empty(node):
        return False
    if kept_classes:
        _set_attr(node, "class", " ".join(kept_classes))
    else:
        _remove_attr(node, "class")
    if align:
        _merge_style(node, "text-align", align)
    if direction and not _attr(node, "dir"):
        _set_attr(node, "dir", direction)
    if indent and node.tag == "li":
        node.list_indent = indent
    elif indent and not _attr(node, "data-lexical-indent"):
        _set_attr(node, "data-lexical-indent", str(indent))
        _merge_style(node, "padding-inline-start", f"{indent * _INDENT_PX}px")
    return True


def _nest_lists(parent: _Node | _Fragment) -> None:
    for child in parent.children:
        if isinstance(child, _Node):
            _nest_lists(child)
    if not isinstance(parent, _Node) or parent.tag not in {"ul", "ol"}:
        return
    if not any(isinstance(child, _Node) and child.tag == "li" and child.list_indent for child in parent.children):
        return
    root = _Node(parent.tag, parent.attrs)
    stack = [root]
    for child in parent.children:
        if isinstance(child, str):
            if child.strip():
                stack[-1].children.append(child)
            continue
        if child.tag != "li":
            stack[-1].children.append(child)
            continue
        level = child.list_indent
        child.list_indent = 0
        while len(stack) > level + 1:
            stack.pop()
        while len(stack) < level + 1:
            host = stack[-1]
            if not host.children or not isinstance(host.children[-1], _Node) or host.children[-1].tag != "li":
                host.children.append(_Node("li", []))
            nested = _Node(parent.tag, [])
            host.children[-1].children.append(nested)
            stack.append(nested)
        stack[-1].children.append(child)
    parent.children = root.children


def _is_empty(node: _Node) -> bool:
    return all(isinstance(child, str) and not child.strip() for child in node.children)


def _attr(node: _Node, name: str) -> str:
    for key, value in node.attrs:
        if key.lower() == name:
            return value or ""
    return ""


def _set_attr(node: _Node, name: str, value: str) -> None:
    for index, (key, _) in enumerate(node.attrs):
        if key.lower() == name:
            node.attrs[index] = (key, value)
            return
    node.attrs.append((name, value))


def _remove_attr(node: _Node, name: str) -> None:
    node.attrs = [(key, value) for key, value in node.attrs if key.lower() != name]


def _merge_style(node: _Node, name: str, value: str) -> None:
    current = _attr(node, "style")
    declarations = [part.strip() for part in current.split(";") if part.strip()]
    if any(part.split(":", 1)[0].strip().lower() == name for part in declarations if ":" in part):
        return
    declarations.append(f"{name}: {value}")
    _set_attr(node, "style", "; ".join(declarations))


def _serialize_children(children: list[_Node | str]) -> str:
    return "".join(_serialize(child) for child in children)


def _serialize(node: _Node | str) -> str:
    if isinstance(node, str):
        if node.startswith("&") or node.startswith("<!--"):
            return node
        return node.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    attrs = "".join(_serialize_attr(key, value) for key, value in node.attrs)
    if node.tag in _VOID_TAGS:
        return f"<{node.tag}{attrs}>"
    return f"<{node.tag}{attrs}>{_serialize_children(node.children)}</{node.tag}>"


def _serialize_attr(key: str, value: str | None) -> str:
    if value is None:
        return f" {key}"
    escaped = value.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")
    return f' {key}="{escaped}"'


def upgrade():
    connection = op.get_bind()
    for table_name, column_name in _WYSIWYG_HTML_COLUMNS:
        rows = connection.execute(
            sa.text(
                f"""
                SELECT id, {column_name} AS content
                FROM {table_name}
                WHERE {column_name} IS NOT NULL
                  AND {column_name} ILIKE '%ql-%'
                """
            )
        ).mappings()
        for row in rows:
            converted = _convert_quill_html(row["content"])
            if converted == row["content"]:
                continue
            connection.execute(
                sa.text(
                    f"""
                    UPDATE {table_name}
                    SET {column_name} = :content
                    WHERE id = :id
                    """
                ),
                {"content": converted, "id": row["id"]},
            )


def downgrade():
    pass
