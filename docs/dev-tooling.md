# Dev tooling

## Introduction

LocalCrag uses Pipenv for managing Python dependencies and npm for managing JavaScript dependencies. Install the dependencies, then run the frontend and backend servers to start developing.

For file storage, LocalCrag uses MinIO, which is a self-hosted S3-compatible object storage solution.

## MinIO setup

Start your MinIO server with the env vars set in the server dev config file:

```bash
export MINIO_ROOT_USER=your-access-key
export MINIO_ROOT_PASSWORD=your-secret-key
export MINIO_INIT_BUCKET=your-bucket
```

```bash
docker run -d --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=$MINIO_ROOT_USER \
  -e MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD \
  quay.io/minio/minio server /data --console-address ":9001"
```

Create a bucket for LocalCrag:

```bash
docker exec -it minio sh -c "
  mc alias set minio http://127.0.0.1:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && \
  mc mb minio/$MINIO_INIT_BUCKET || true && \
  mc anonymous set public minio/$MINIO_INIT_BUCKET
"
```

## Notification digest mails (dev)

Pending notification digest emails are normally sent by a daily scheduler. To trigger the mailer immediately during local development (`FLASK_ENV=development`, or `flask run` with `FLASK_DEBUG=1` as in Docker Compose), call:

```bash
curl -X POST http://localhost:5000/api/dev/notification-digest-mails
```

The endpoint is unauthenticated, returns `404` outside development (`FLASK_ENV=production`, or neither `FLASK_ENV=development` nor `FLASK_DEBUG`), and sends all pending digest mails immediately (including weekly-digest users).

## Release notes

In-app release notes are driven by `server/src/data/release_notes_manifest.json`. Each item has a short `key`, a `type` (`FEATURE` or `FIX`), and translations in the client locale files under `releaseNotes.notes.<key>` (body) and `releaseNotes.notes.<key>_title` (title).

### Add a release note item

Use the interactive script (no extra dependencies; run from anywhere in the repo):

```bash
cd server/src && python3 util/scripts/add_release_note_item.py
```

The script will prompt for:

- **Note key** — short id only (e.g. `lineFilters`), not the `releaseNotes.notes.` prefix
- **Note type** — `FEATURE` or `FIX`
- **Language** — which top-level locale file to update first (`en`, `de`, `it`, `nl`, …)
- **Title and body** — one line each for that locale

It then:

1. Appends the item to `release_notes_manifest.json`
2. Writes the title and body strings into the chosen `client/src/assets/i18n/<locale>.json`
3. Regenerates `client/src/app/utility/release-note-transloco-keys.ts` (do not edit the marker list by hand)

Copy the same `releaseNotes.notes.<key>` and `releaseNotes.notes.<key>_title` entries into the other locale files when you are ready.

After deploy, the server syncs the manifest into the database (`sync_release_notes_catalog` on startup / migrations). Users receive in-app notifications for new bundles on the next sync.

### Validate the manifest

CI checks the manifest against `release_notes_manifest.schema.json` (duplicate keys, required fields, etc.):

```bash
cd server && pipenv install --dev && pipenv run python src/util/scripts/validate_release_notes_manifest.py
```

Run this before pushing if you edited `release_notes_manifest.json` by hand.

## Docker development setup

LocalCrag alternatively provides a Docker Compose setup for development. This allows you to run the frontend, backend, and MinIO in isolated containers.
See [docker-dev-setup.md](./docs/docker-dev-setup.md) for more information on how to set up and use the Docker development environment.

## pre-commit hooks for linting using Husky and lint-staged

The linting pipeline will do several checks on the codebase. To ensure that your code is properly formatted and passes
all checks _before_ you commit and push it, you can install and set up Husky. Husky will run linting commands against
the staged files using lint-staged before each commit.

### Installing Husky

1. Run `npm install` in the root directory of the project to install Husky and its dependencies.
2. Initialize Husky by running `npx husky init`. This will activate the existing hooks in the project.
3. Make sure to install the `lint-staged` package in both the client and the server directories using `npm install`.

### Using Husky during development

- Automatic hook execution: Once initialized, the Husky hooks will run automatically before each commit. This ensures
  that your code is formatted and linted according to the project's standards.

### Importance of Husky

Using `husky` ensures that your code is formatted correctly and passes all linting checks before being committed. This
helps prevent pipeline failures due to formatting issues or linting errors. Make sure to set up and use `Husky` to
maintain code quality and consistency throughout the project.
