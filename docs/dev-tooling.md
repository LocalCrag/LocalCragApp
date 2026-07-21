# Local development toolchain

This guide is the hub for setting up LocalCrag for local development. Detailed native setup steps live in the [client](../client/README.md) and [server](../server/README.md) READMEs; this page covers prerequisites, path choice, shared tooling, and common day-to-day workflows.

## Prerequisites

| Tool | Notes |
|------|--------|
| **Git** | Clone the repository |
| **Node.js** | Client: Node ≥ 21 (see [client README](../client/README.md)) |
| **npm** | Used for the client, root Husky install, and server `lint-staged` |
| **Python** | `3.14` (see `server/Pipfile` `[requires]`) |
| **Pipenv** | Server dependency management |
| **PostgreSQL** | Required for native server setup |
| **Docker** | Optional; required for the Compose-based path and convenient for MinIO |

## Choose a setup path

| Path | Best when | Start here |
|------|-----------|------------|
| **Docker Compose (dev)** | You want frontend, backend, Postgres, MinIO, MailHog, and Adminer with minimal host setup | [Docker development setup](./docker-dev-setup.md) |
| **Native** | You prefer running Angular/`flask` on the host (faster iteration, IDE debugging) | [Client README](../client/README.md) + [Server README](../server/README.md) + [MinIO](#minio-setup) below |

Both paths need a `server/src/config/dev.cfg` copied from `server/src/config/template.cfg` (fill at least the `SUPERADMIN_*` values; for native also DB and S3 settings).

## Docker Compose (dev)

Use the **dev** compose file (`docker-compose.dev.yml`), not the production `docker-compose.yml`.

```bash
# from repo root
cp server/src/config/template.cfg server/src/config/dev.cfg
# edit SUPERADMIN_* in server/src/config/dev.cfg

docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up
```

Full steps, URLs, and teardown: [docker-dev-setup.md](./docker-dev-setup.md).

## Native setup (overview)

1. **Client** — install Node, `cd client && npm i`, then `npm run dev` (Tailwind watch + `ng serve`). Details: [client/README.md](../client/README.md).
2. **Server** — install Python/Pipenv/Postgres, `cd server && pipenv install`, create `src/config/dev.cfg`, run migrations and `flask run`. Details: [server/README.md](../server/README.md).
3. **Object storage** — run MinIO (below) and point the S3_* keys in `dev.cfg` at it. Needed for uploads.
4. **Pre-commit hooks** — from the repo root, `npm install` (activates Husky). See [Pre-commit hooks](#pre-commit-hooks-husky--lint-staged).

Config reference: [environment-variables.md](./environment-variables.md).

## MinIO setup

For native development, LocalCrag uses MinIO as S3-compatible object storage. Align credentials with the `S3_*` values in `server/src/config/dev.cfg`.

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

Create and publish the bucket:

```bash
docker exec -it minio sh -c "
  mc alias set minio http://127.0.0.1:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD && \
  mc mb minio/$MINIO_INIT_BUCKET || true && \
  mc anonymous set public minio/$MINIO_INIT_BUCKET
"
```

The Docker Compose path already includes MinIO; you do not need this standalone container when using `docker-compose.dev.yml`.

## Pre-commit hooks (Husky + lint-staged)

Root Husky runs `lint-staged` in `server/` then `client/` before each commit (see `.husky/pre-commit`).

### Install

From the **repository root**:

```bash
npm install
```

The root `prepare` script runs `husky install` and activates the existing hooks. Also install dependencies in `client/` and `server/` if you have not already (`npm install` in each), so `npx lint-staged` can run.

Do **not** run `npx husky init` — that recreates hooks and can overwrite the project’s `.husky/pre-commit`.

### What runs

- **Server** (`server/package.json`): Black, flake8, and isort on staged `*.py` via Pipenv.
- **Client** (`client/package.json`): Prettier and ESLint on staged JS/TS (and Prettier on i18n JSON).

## Tests (pointers)

- **Client unit tests:** `cd client && npm run test` (CI: `npm run test:ci`)
- **Client E2E:** see [client/README.md](../client/README.md) (`npm run e2e` / Cypress)
- **Server tests:** pytest under `server/tests` with a test config — see [server/README.md](../server/README.md)

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

## Related docs

- [Contributor guidelines](../CONTRIBUTING.md)
- [Docker Compose production install](./docker-compose-installation.md)
- [Environment variables](./environment-variables.md)
