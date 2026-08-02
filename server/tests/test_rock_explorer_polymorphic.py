import uuid

import pytest
from marshmallow import ValidationError

from extensions import db
from marshmallow_schemas.tag_schema import tag_schema
from models.comment import Comment
from models.line import Line
from models.rock_explorer_feature import RockExplorerFeature
from models.tag import Tag
from util.generic_relationships import check_object_exists
from util.tag_object_prefetch import prefetch_tag_objects
from webargs_schemas.comment_args import comment_args
from webargs_schemas.tag_args import tag_args


def _create_feature(title="Polymorphic feature"):
    feature = RockExplorerFeature()
    feature.title = title
    feature.geometry = {"type": "Point", "coordinates": [8.1, 50.2]}
    db.session.add(feature)
    db.session.commit()
    return feature


def _create_comment(target, message="hi"):
    comment = Comment()
    comment.message = message
    comment.object = target
    db.session.add(comment)
    db.session.commit()
    return comment


def test_comment_args_allow_rock_explorer_object_types():
    comment_args["objectType"].validate("RockExplorerFeature")

    with pytest.raises(ValidationError):
        comment_args["objectType"].validate("RockExplorerCluster")

    with pytest.raises(ValidationError):
        comment_args["objectType"].validate("rock_explorer_feature")


def test_tag_args_allow_rock_explorer_object_types():
    tag_args["objectType"].validate("RockExplorerFeature")

    with pytest.raises(ValidationError):
        tag_args["objectType"].validate("RockExplorerCluster")

    with pytest.raises(ValidationError):
        tag_args["objectType"].validate("rock_explorer_feature")


def test_check_object_exists_for_rock_explorer_feature():
    feature = _create_feature()

    assert check_object_exists("RockExplorerFeature", feature.id) is True
    assert check_object_exists("RockExplorerFeature", uuid.uuid4()) is False


def test_prefetch_tag_objects_resolves_rock_explorer_targets():
    feature = _create_feature()

    feature_tag = Tag()
    feature_tag.object = feature
    db.session.add(feature_tag)

    db.session.commit()
    db.session.expire_all()

    prefetch_tag_objects([feature_tag])

    assert feature_tag.object.id == feature.id


def test_tag_schema_serializes_rock_explorer_target():
    feature = _create_feature()

    feature_tag = Tag()
    feature_tag.object = feature
    db.session.add(feature_tag)
    db.session.commit()
    db.session.expire_all()

    prefetch_tag_objects([feature_tag])

    dumped = tag_schema.dump([feature_tag])[0]

    assert dumped["objectType"] == "RockExplorerFeature"
    assert dumped["object"]["id"] == str(feature.id)
    assert dumped["object"]["title"] == feature.title


def test_deleting_rock_explorer_feature_cascades_comments():
    feature = _create_feature()
    feature_id = feature.id

    _create_comment(feature, "first")
    _create_comment(feature, "second")

    line = Line.find_by_id(Line.get_id_by_slug("the-vessel"))
    line_comment = _create_comment(line, "unrelated")
    line_comment_id = line_comment.id

    db.session.delete(feature)
    db.session.commit()

    assert Comment.query.filter_by(object_type="RockExplorerFeature", object_id=feature_id).count() == 0
    assert Comment.query.filter_by(id=line_comment_id).count() == 1
