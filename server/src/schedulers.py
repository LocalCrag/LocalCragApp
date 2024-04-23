from flask import current_app

from extensions import scheduler
from util.scripts.build_rankings import build_rankings


def start_schedulers():
    if not scheduler.state == 0:
        scheduler.add_job(func=build_rankings, trigger="interval", seconds=60 * 15, id='build_rankings')
        scheduler.start()
