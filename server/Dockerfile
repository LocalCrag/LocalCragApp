FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    WORKDIR=/app \
    PYTHONPATH=/app/src
WORKDIR $WORKDIR

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libmagic1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && pip install pipenv
COPY Pipfile Pipfile.lock $WORKDIR/
RUN pipenv install --system --deploy --ignore-pipfile
COPY . $WORKDIR

EXPOSE 8000
CMD sh -c "cd src && pipenv run flask db upgrade && pipenv run python util/scripts/database_setup.py && gunicorn -w 4 -b 0.0.0.0:8000 app:app"