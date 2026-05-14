from flask import jsonify
from flask.views import MethodView
from flask_jwt_extended import get_jwt_identity, jwt_required

from error_handling.http_exceptions.not_found import NotFound
from models.enums.release_note_item_type_enum import release_note_type_display_rank
from models.release_note_bundle import ReleaseNoteBundle
from models.user import User


class GetReleaseNoteBundle(MethodView):
    @jwt_required()
    def get(self, bundle_id):
        _ = User.find_by_email(get_jwt_identity())
        bundle = ReleaseNoteBundle.query.filter_by(id=bundle_id).first()
        if not bundle:
            raise NotFound()
        items = sorted(
            bundle.items,
            key=lambda i: (release_note_type_display_rank(i.note_type), i.item_key),
        )
        return (
            jsonify(
                {
                    "id": str(bundle.id),
                    "timeCreated": bundle.time_created,
                    "items": [
                        {
                            "key": item.item_key,
                            "type": item.note_type.value,
                        }
                        for item in items
                    ],
                }
            ),
            200,
        )
