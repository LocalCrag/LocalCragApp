# Using the Docker development setup

This uses **`docker-compose.dev.yml`** (local hot-reload stack). Do not use production `docker-compose.yml` for day-to-day development.

**Step 1**: Copy `server/src/config/template.cfg` to `server/src/config/dev.cfg` and fill the `SUPERADMIN_*` variables

**Step 2**: Build application containers:

```bash
docker compose -f docker-compose.dev.yml build
```

**Step 3**: Start the setup:

```bash
docker compose -f docker-compose.dev.yml up
```

The frontend takes a bit to be ready.

You find the following web UIs available:

- Frontend at http://localhost:4200: Shows you the frontend (credentials sent via email)
- MailHog at http://localhost:8025: Shows you all the emails
- Adminer at http://localhost:8080: Database web interface
- SeaweedFS UI at http://localhost:8888: Shows you all objects in the S3 storage

You probably won't need to access these directly:

- Backend at http://localhost:5000
- Object Storage at http://localhost:8333

**Step 4a**: Remove the deployment:

```bash
docker compose -f docker-compose.dev.yml down
```

**Step 4b**: Remove the deployment, database content and stored objects:

```bash
docker compose -f docker-compose.dev.yml down -v
```

## Coming from the MinIO setup

Object storage used to be MinIO on ports 9000/9001. It is now SeaweedFS on 8333/8888. If you had the stack running before, reset the volumes once so the storage volume does not keep leftover MinIO files — your local uploads are discarded, the database is rebuilt on the next start:

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up
```

For the broader local toolchain (native setup, Husky, object storage standalone, etc.), see [dev-tooling.md](./dev-tooling.md).
