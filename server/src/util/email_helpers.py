"""Utilities for generating absolute frontend URLs used in emails.

This module exists to avoid importing the full `util.email` module from places that
only need URL helpers (prevents import cycles and reduces side-effects).
"""

from __future__ import annotations

from flask import current_app

from models.area import Area
from models.comment import Comment
from models.crag import Crag
from models.line import Line
from models.post import Post
from models.region import Region
from models.sector import Sector


def frontend_url(path: str) -> str:
    """Return an absolute link to the frontend for a given path."""
    path = (path or "").lstrip("/")
    return f"{current_app.config['FRONTEND_HOST']}/{path}"


def build_comment_action_link(comment: Comment) -> str:
    """Return a frontend link matching the commented object to view the conversation."""
    obj = comment.object
    # Lines
    if isinstance(obj, Line):
        return frontend_url(
            f"topo/{obj.area.sector.crag.slug}/{obj.area.sector.slug}/{obj.area.slug}/{obj.slug}/comments#{comment.id}"
        )
    # Areas
    if isinstance(obj, Area):
        return frontend_url(f"topo/{obj.sector.crag.slug}/{obj.sector.slug}/{obj.slug}/comments#{comment.id}")
    # Sectors
    if isinstance(obj, Sector):
        return frontend_url(f"topo/{obj.crag.slug}/{obj.slug}/comments#{comment.id}")
    # Crags
    if isinstance(obj, Crag):
        return frontend_url(f"topo/{obj.slug}/comments#{comment.id}")
    # Region
    if isinstance(obj, Region):
        return frontend_url(f"topo/comments#{comment.id}")
    # Blog posts
    if isinstance(obj, Post):
        return frontend_url(f"news/{obj.slug}#{comment.id}")
    # Fallback
    return current_app.config["FRONTEND_HOST"]
