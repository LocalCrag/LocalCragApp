#!/bin/sh

pipenv run flask db upgrade

python3 scripts/database_setup.py

gunicorn -b 0.0.0.0:5000 wsgi:app --error-logfile '/usr/src/app/gunicorn_error.log' --worker-tmp-dir /dev/shm --workers=2 --threads=4 --worker-class=gthread