from collections import defaultdict
from typing import Dict, Iterable, List

from extensions import db
from models.reaction import Reaction
from models.user import User


def get_reactions_by_user(target_type: str, target_ids: Iterable[str]) -> Dict[str, List[dict]]:
    """Return reactions per target, including minimal user info.

    Output format:
    {
      "<target_id>": [
          {"emoji": "🔥", "user": {"id": "...", "slug": "...", "firstname": "...", "lastname": "...", "avatar": ...}},
      ]
    }
    """

    target_ids_list = list(target_ids)
    if not target_ids_list:
        return {}

    rows = (
        db.session.query(Reaction.target_id, Reaction.emoji, User)
        .join(User, User.id == Reaction.created_by_id)
        .filter(Reaction.target_type == target_type)
        .filter(Reaction.target_id.in_(target_ids_list))
        .order_by(Reaction.time_created.asc(), Reaction.id.asc())
        .all()
    )

    out: Dict[str, List[dict]] = defaultdict(list)
    for target_id, emoji, user in rows:
        out[str(target_id)].append(
            {
                "emoji": emoji,
                "user": user,
            }
        )
    return dict(out)
