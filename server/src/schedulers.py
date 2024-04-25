import os

from flask import current_app

from extensions import scheduler
from util.scripts.build_rankings import build_rankings


def start_schedulers(app):
    if not scheduler.running and app.config['ENABLE_SCHEDULERS']:
        scheduler.add_job(func=build_rankings, trigger="interval", seconds=60 * 15, id='build_rankings')
        scheduler.start()
