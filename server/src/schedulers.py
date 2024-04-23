from flask import current_app

from extensions import scheduler
from util.scripts.build_rankings import build_rankings


def start_schedulers():
    if not scheduler.running:
        scheduler.add_job(func=build_rankings, trigger="interval", seconds=30, id='build_rankings')
        scheduler.start()

