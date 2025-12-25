import datetime
from bisect import insort

from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from extensions import db
from models.ascent import Ascent
from models.enums.line_type_enum import LineTypeEnum
from models.instance_settings import InstanceSettings
from models.line import Line
from models.ranking import Ranking
from models.user import User


class UserRankingMap:
    user_id = None
    map = {}
    map_secret = {}

    def __init__(self, user_id):
        self.user_id = user_id
        for type in LineTypeEnum:
            for map in [self.map, self.map_secret]:
                map[type] = {
                    "global": None,
                    "crags": {},
                    "sectors": {},
                }

    def get_map(self, secret=False):
        if not secret:
            return self.map
        else:
            return self.map_secret

    def add(self, ranking: Ranking):
        ranking.reset()
        map = self.get_map(ranking.secret)
        if not ranking.crag_id and not ranking.sector_id:
            map[ranking.type]["global"] = ranking
        if ranking.crag_id:
            map[ranking.type]["crags"][ranking.crag_id] = ranking
        if ranking.sector_id:
            map[ranking.type]["sectors"][ranking.sector_id] = ranking

    def get_global(self, type: LineTypeEnum, secret: bool):
        map = self.get_map(secret)
        if not map[type]["global"]:
            map[type]["global"] = Ranking.get_new_ranking(self.user_id, type, secret=secret)
        return map[type]["global"]

    def get_crag(self, type: LineTypeEnum, crag_id, secret: bool):
        map = self.get_map(secret)
        if crag_id not in map[type]["crags"]:
            map[type]["crags"][crag_id] = Ranking.get_new_ranking(self.user_id, type, crag_id=crag_id, secret=secret)
        return map[type]["crags"][crag_id]

    def get_sector(self, type: LineTypeEnum, sector_id, secret: bool):
        map = self.get_map(secret)
        if sector_id not in map[type]["sectors"]:
            map[type]["sectors"][sector_id] = Ranking.get_new_ranking(
                self.user_id, type, sector_id=sector_id, secret=secret
            )
        return map[type]["sectors"][sector_id]


def _push_top_value_sorted(top_values: list, value, limit: int = 50) -> None:
    """Maintain a sorted (ascending) list of top values with a fixed max length.

    This avoids sorting on every update and keeps memory bounded.
    """
    if top_values is None:
        return

    if len(top_values) < limit:
        insort(top_values, value)
        return

    # List is ascending; index 0 is the smallest.
    if not top_values:
        top_values.append(value)
        return

    if value <= top_values[0]:
        return

    # Replace the smallest and restore order with an insertion.
    top_values.pop(0)
    insort(top_values, value)


def build_rankings():
    instance_settings = InstanceSettings.return_it()
    # Snapshot settings into plain Python values.
    # The job expunges the session to keep RAM bounded; ORM instances can become
    # detached/expired across commits/expunges.
    display_user_grades = bool(getattr(instance_settings, "display_user_grades", False))
    ranking_past_weeks = getattr(instance_settings, "ranking_past_weeks", None)
    cutoff_date = None
    if ranking_past_weeks is not None:
        cutoff_date = datetime.datetime.now(datetime.timezone.utc).date() - datetime.timedelta(
            days=7 * ranking_past_weeks
        )
    user_ids = db.session.execute(select(User.id).order_by(User.id)).scalars().all()
    for user_id in user_ids:
        # Build ranking map
        ranking_map = UserRankingMap(user_id)
        rankings = Ranking.return_all_for_user(user_id)
        for ranking in rankings:
            ranking_map.add(ranking)
        # Stream ascents with scalar columns only (avoid loading full ORM graphs).
        # We only need: crag/sector, line type/secret, and one grade value.
        grade_col = Line.user_grade_value if display_user_grades else Line.author_grade_value
        query = (
            select(
                Line.id.label("line_id"),
                Line.type.label("line_type"),
                Line.secret.label("line_secret"),
                grade_col.label("grade_value"),
                Ascent.crag_id.label("crag_id"),
                Ascent.sector_id.label("sector_id"),
            )
            .select_from(Ascent)
            .join(Line, Line.id == Ascent.line_id)
            .filter(Ascent.created_by_id == user_id)
            .filter(Line.archived.is_(False))
            .order_by(Line.id, Ascent.id)
            .distinct(Line.id)
        )
        if cutoff_date is not None:
            query = query.filter(Ascent.ascent_date >= cutoff_date)

        ascent_counter = 0
        for row in db.session.execute(query).yield_per(500):
            ascent_counter += 1

            line_type = row.line_type
            line_is_secret = row.line_secret
            ascent_value = row.grade_value
            crag_id = row.crag_id
            sector_id = row.sector_id

            for secret in (False, True):
                if (not secret) and line_is_secret:
                    continue

                global_ranking = ranking_map.get_global(line_type, secret)
                crag_ranking = ranking_map.get_crag(line_type, crag_id, secret)
                sector_ranking = ranking_map.get_sector(line_type, sector_id, secret)

                for ranking in (global_ranking, crag_ranking, sector_ranking):
                    ranking.total_count += 1
                    _push_top_value_sorted(ranking.top_values, ascent_value, limit=50)

            # Periodically flush to keep transaction pressure down.
            if ascent_counter % 2000 == 0:
                db.session.flush()

        # Finalize derived sums once per ranking.
        for type in LineTypeEnum:
            for secret in (False, True):
                m = ranking_map.get_map(secret)[type]
                candidates = []
                if m["global"] is not None:
                    candidates.append(m["global"])
                candidates.extend(m["crags"].values())
                candidates.extend(m["sectors"].values())

                for ranking in candidates:
                    # top_values are kept sorted ascending.
                    ranking.top_50 = sum(ranking.top_values)
                    ranking.top_10 = sum(ranking.top_values[-10:])
                    db.session.add(ranking)
                    flag_modified(ranking, "top_values")

        # Delete rankings if they don't contain any ascents anymore - can happen when all ascents become secret
        for ranking in rankings:
            if ranking.total_count == 0:
                db.session.delete(ranking)
        db.session.commit()

        # Keep per-user memory bounded.
        db.session.expunge_all()
