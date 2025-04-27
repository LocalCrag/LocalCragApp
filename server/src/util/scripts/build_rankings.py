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


def build_rankings():
    print("Starting ranking calculation...")
    instance_settings = InstanceSettings.return_it()
    users = User.return_all()
    for user in users:
        # Build ranking map
        ranking_map = UserRankingMap(user.id)
        rankings = Ranking.return_all_for_user(user.id)
        for ranking in rankings:
            ranking_map.add(ranking)
            db.session.add(ranking)
        # Pagination needed for not generating too large requests
        page = 1
        has_next_page = True
        while has_next_page:
            query = (
                select(Ascent)
                .join(Line)
                .filter(Ascent.created_by_id == user.id, Line.archived.is_(False))
                .distinct(Line.id)
            )
            paginated_ascents = db.paginate(query, page=page, per_page=50)
            has_next_page = paginated_ascents.has_next
            if paginated_ascents.has_next:
                page += 1
            for ascent in paginated_ascents.items:
                for secret in [False, True]:
                    line: Line = ascent.line
                    if not secret and line.secret:
                        continue
                    ascent_value = (
                        line.user_grade_value if instance_settings.display_user_grades else line.author_grade_value
                    )
                    global_ranking = ranking_map.get_global(line.type, secret)
                    crag_ranking = ranking_map.get_crag(line.type, ascent.crag_id, secret)
                    sector_ranking = ranking_map.get_sector(line.type, ascent.sector_id, secret)
                    for ranking in [global_ranking, crag_ranking, sector_ranking]:
                        ranking.total_count += 1
                        ranking.top_values.sort()
                        if len(ranking.top_values) < 50:
                            ranking.top_values.append(ascent_value)
                        else:
                            if ascent_value > ranking.top_values[0]:
                                ranking.top_values[0] = ascent_value
                        ranking.top_50 = sum(ranking.top_values)
                        ranking.top_10 = sum(sorted(ranking.top_values, reverse=True)[:10])
                        db.session.add(ranking)
                        flag_modified(ranking, "top_values")
        # Delete rankings if they don't contain any ascents anymore - can happen when all ascents become secret
        for ranking in rankings:
            if ranking.total_count == 0:
                db.session.delete(ranking)
        db.session.commit()
    print("Rankings successfully calculated.")
