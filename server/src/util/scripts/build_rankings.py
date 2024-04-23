from sqlalchemy.orm.attributes import flag_modified

from extensions import db, scheduler
from models.ascent import Ascent
from models.grades import get_grade_value
from models.line import Line
from models.ranking import Ranking
from models.user import User


def build_rankings():
    with scheduler.app.app_context():
        exponential_base = 1.5

        # Reset all rankings before recomputation
        rankings = Ranking.return_all()
        for ranking in rankings:
            ranking.top_values = []
            ranking.top_fa_values = []
            ranking.total = 0
            ranking.total_exponential = 0
            ranking.total_count = 0
            ranking.total_fa = 0
            ranking.total_fa_exponential = 0
            ranking.total_fa_count = 0
        users = User.return_all()
        for user in users:
            ascents = Ascent.return_all(filter=lambda: Ascent.created_by_id == user.id)
            for ascent in ascents:
                line: Line = ascent.line
                ascent_value = get_grade_value(line.grade_name, line.grade_scale, line.type)
                global_ranking = Ranking.find_for_user(user.id, line.type)
                crag_ranking = Ranking.find_for_user(user.id, line.type, crag_id=ascent.crag_id)
                sector_ranking = Ranking.find_for_user(user.id, line.type, sector_id=ascent.sector_id)
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
                    ranking.top_10 = sum(sorted(ranking.top_values)[:10])
                    ranking.top_10_exponential = sum([exponential_base ** x for x in sorted(ranking.top_values)[:10]])
                    db.session.add(ranking)
                    flag_modified(ranking, "top_fa_values")
                    flag_modified(ranking, "top_values")
        db.session.commit()


if __name__ == "__main__":
    build_rankings()
