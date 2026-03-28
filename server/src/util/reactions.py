from collections import defaultdict
from typing import Dict, Iterable, List, Tuple

from extensions import db
from models.reaction import Reaction


def get_reaction_counts(target_type: str, target_ids: Iterable[str]) -> Dict[str, Dict[str, int]]:
    """Return aggregated reaction counts for targets.

    Output format:
    {
      "<target_id>": {"💪": 2, "🔥": 1}
    }
    """

    target_ids_list = list(target_ids)
    if not target_ids_list:
        return {}

    rows: List[Tuple[str, str, int]] = (
        db.session.query(Reaction.target_id, Reaction.emoji, db.func.count(Reaction.id))
        .filter(Reaction.target_type == target_type)
        .filter(Reaction.target_id.in_(target_ids_list))
        .group_by(Reaction.target_id, Reaction.emoji)
        .all()
    )

    out: Dict[str, Dict[str, int]] = defaultdict(dict)
    for target_id, emoji, cnt in rows:
        out[str(target_id)][emoji] = int(cnt)
    return dict(out)
