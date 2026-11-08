# Backup image for the LocalCrag Helm CronJob.
# pg_dump comes from the official Postgres image so the client matches
# helm/localcrag/values.yaml postgres.image.tag. rclone and CA certificates
# are installed here so the job does not apt-get on every run.
# .github/workflows/publish-docker.yml passes POSTGRES_TAG from that file.

ARG POSTGRES_TAG=17.7
FROM postgres:${POSTGRES_TAG}

USER root
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates rclone \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

LABEL org.opencontainers.image.source="https://github.com/LocalCrag/LocalCragApp"
LABEL org.opencontainers.image.description="Backup image for LocalCrag (pg_dump and rclone)."
LABEL org.opencontainers.image.licenses="AGPL-3.0"
