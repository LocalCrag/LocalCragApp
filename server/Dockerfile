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
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && pip install pipenv
COPY Pipfile Pipfile.lock $WORKDIR/
RUN pipenv install --system --deploy --ignore-pipfile
COPY . $WORKDIR

EXPOSE 5000
CMD sh -c "\
    cd src && \
    flask db upgrade && \
    python3 util/scripts/database_setup.py && \
    cd .. && \
    gunicorn  --config src/gunicorn.conf.py \
"

LABEL org.opencontainers.image.source=https://github.com/LocalCrag/LocalCragApp
LABEL org.opencontainers.image.description="Server for LocalCrag, a climbing crag database and guidebook platform."
LABEL org.opencontainers.image.licenses="AGPL-3.0"
