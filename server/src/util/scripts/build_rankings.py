from sqlalchemy.orm.attributes import flag_modified

from extensions import db, scheduler
from models.ascent import Ascent
from models.enums.line_type_enum import LineTypeEnum
from models.grades import get_grade_value
from models.line import Line
from models.ranking import Ranking
from models.user import User


class UserRankingMap():
    user_id = None
    map = {}

    def __init__(self, user_id):
        self.user_id = user_id
        for type in LineTypeEnum:
            self.map[type] = {
                'global': None,
                'crags': {},
                'sectors': {},
            }

    def add(self, ranking: Ranking):
        ranking.reset()
        if not ranking.crag_id and not ranking.sector_id:
            self.map[ranking.type]['global'] = ranking
        if ranking.crag_id:
            self.map[ranking.type]['crags'][ranking.crag_id] = ranking
        if ranking.sector_id:
            self.map[ranking.type]['sectors'][ranking.sector_id] = ranking

    def get_global(self, type: LineTypeEnum):
        if self.map[type]['global']:
            return self.map[type]['global']
        return Ranking.get_new_ranking(self.user_id, type)

    def get_crag(self, type: LineTypeEnum, crag_id):
        if crag_id in self.map[type]['crags']:
            return self.map[type]['crags'][crag_id]
        return Ranking.get_new_ranking(self.user_id, type, crag_id=crag_id)

    def get_sector(self, type: LineTypeEnum, sector_id):
        if sector_id in self.map[type]['sectors']:
            return self.map[type]['sectors'][sector_id]
        return Ranking.get_new_ranking(self.user_id, type, sector_id=sector_id)


def build_rankings(app=None):
    if not app:
        app = scheduler.app
    with app.app_context():
        print('Starting ranking calculation...')
        exponential_base = 1.5
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
                query = db.session.query(Ascent).filter(Ascent.created_by_id == user.id)
                paginated_ascents = db.paginate(query, page=page, per_page=50)
                has_next_page = paginated_ascents.has_next
                if paginated_ascents.has_next:
                    page += 1
                for ascent in paginated_ascents.items:
                    line: Line = ascent.line
                    ascent_value = get_grade_value(line.grade_name, line.grade_scale, line.type)
                    global_ranking = ranking_map.get_global(line.type)
                    crag_ranking = ranking_map.get_crag(line.type, ascent.crag_id)
                    sector_ranking = ranking_map.get_sector(line.type, ascent.sector_id)
                    for ranking in [global_ranking, crag_ranking, sector_ranking]:
                        ranking.total_count += 1
                        ranking.total += ascent_value
                        ranking.total_exponential += exponential_base ** ascent_value
                        ranking.top_values.sort()
                        ranking.top_fa_values.sort()
                        if ascent.fa:
                            ranking.total_fa_count += 1
                            ranking.total_fa += ascent_value
                            ranking.total_fa_exponential += exponential_base ** ascent_value
                        if len(ranking.top_values) < 25:
                            ranking.top_values.append(ascent_value)
                        else:
                            if ascent_value > ranking.top_values[0]:
                                ranking.top_values[0] = ascent_value
                        if ascent.fa:
                            if len(ranking.top_fa_values) < 10:
                                ranking.top_fa_values.append(ascent_value)
                            else:
                                if ascent_value > ranking.top_fa_values[0]:
                                    ranking.top_fa_values[0] = ascent_value
                        ranking.top_25 = sum(ranking.top_values)
                        ranking.top_25_exponential = sum([exponential_base ** x for x in ranking.top_values])
                        ranking.top_10_fa = sum(ranking.top_fa_values)
                        ranking.top_10_fa_exponential = sum([exponential_base ** x for x in ranking.top_fa_values])
                        ranking.top_10 = sum(sorted(ranking.top_values, reverse=True)[:10])
                        ranking.top_10_exponential = sum(
                            [exponential_base ** x for x in sorted(ranking.top_values, reverse=True)[:10]])
                        db.session.add(ranking)
                        flag_modified(ranking, "top_fa_values")
                        flag_modified(ranking, "top_values")
            db.session.commit()
        print('Rankings successfully calculated.')


if __name__ == "__main__":
    build_rankings()
