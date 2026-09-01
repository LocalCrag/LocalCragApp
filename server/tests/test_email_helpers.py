from extensions import db
from models.comment import Comment
from models.line import Line
from models.rock_explorer_feature import RockExplorerFeature
from util.email_helpers import build_comment_action_link


def test_build_comment_action_link_for_line(client):
    line = Line.find_by_slug("the-vessel")
    comment = Comment(message="Topo link", object=line)
    db.session.add(comment)
    db.session.commit()

    link = build_comment_action_link(comment)
    assert "/topo/" in link
    assert "/comments#" in link
    assert str(comment.id) in link
    assert link.endswith(f"#{comment.id}")


def test_build_comment_action_link_for_rock_explorer_feature(client):
    feature = RockExplorerFeature()
    feature.title = "Mail link feature"
    feature.geometry = {"type": "Point", "coordinates": [8.1, 50.2]}
    db.session.add(feature)
    db.session.commit()

    comment = Comment(message="Explorer link", object=feature)
    db.session.add(comment)
    db.session.commit()

    link = build_comment_action_link(comment)
    assert f"/rock-explorer/{feature.id}?tab=comments#{comment.id}" in link


def test_build_comment_action_link_for_ascent(client):
    from models.ascent import Ascent

    ascent = Ascent.query.first()
    comment = Comment(message="Ascent link", object=ascent)
    db.session.add(comment)
    db.session.commit()

    link = build_comment_action_link(comment)
    assert "/ascents?ascent=" in link
    assert str(ascent.id) in link
    assert str(comment.id) in link
    assert ascent.line.slug in link
    assert link.endswith(f"#{comment.id}")
