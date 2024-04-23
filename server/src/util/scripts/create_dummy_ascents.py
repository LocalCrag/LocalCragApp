import datetime
import random

from app import app
from extensions import db
from models.ascent import Ascent
from models.crag import Crag
from models.enums.line_type_enum import LineTypeEnum
from models.grades import GRADES
from models.line import Line
from models.sector import Sector
from models.user import User


def create_dummy_ascents():
    with app.app_context():
        n = 1000
        crags = Crag.return_all()
        users = User.return_all()
        for crag in crags:
            for sector in crag.sectors:
                for area in sector.areas:
                    for line in area.lines:
                        for user in users:
                            for _ in range(n):
                                ascent = Ascent()
                                ascent.year = 2024
                                ascent.created_by_id = user.id
                                ascent.ascent_date = datetime.datetime.now().date()
                                ascent.line_id = line.id
                                ascent.area_id = area.id
                                ascent.crag_id = crag.id
                                ascent.sector_id = sector.id
                                ascent.rating = 5
                                ascent.grade_scale = line.grade_scale
                                ascent.grade_name = random.choice(GRADES[LineTypeEnum.BOULDER][line.grade_scale])['name']
                                if ascent.grade_name in ['CLOSED_PROJECT', 'OPEN_PROJECT', 'UNGRADED']:
                                    ascent.grade_name = '1'
                                db.session.add(ascent)
        db.session.commit()


if __name__ == "__main__":
    create_dummy_ascents()
