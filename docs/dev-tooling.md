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
