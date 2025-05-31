# Installation

For deploying a LocalCrag instance, we provide a Docker Compose setup that includes all necessary services. This setup is designed to be easy to use and requires minimal configuration.

## Clone the Repository

To get started, clone the LocalCrag repository:

```bash
git clone https://github.com/LocalCrag/LocalCragApp.git localcrag
cd localcrag
```
## Configure Environment Variables

Create a `docker-compose.override.yml` file in the root directory of the cloned repository. This file will override the default environment variables for your local setup. Here is an example configuration:

```yaml
services:
  database:
    environment:
      POSTGRES_PASSWORD: password

  storage:
    environment:
      MINIO_ROOT_PASSWORD: password

  server:
    environment:
      SQLALCHEMY_DATABASE_URI: "postgresql://localcrag:password@database/localcrag"
      SPACES_ACCESS_KEY: localcrag
      SPACES_SECRET_KEY: password
      SUPERADMIN_FIRSTNAME: Firstname
      SUPERADMIN_LASTNAME: Lastname
      SUPERADMIN_EMAIL: example@example.com
      SECRET_KEY: test
      JWT_SECRET_KEY: test
      SYSTEM_EMAIL: example@example.com
      SMTP_HOST: smtp.example.com
      SMTP_USER: user
      SMTP_PASSWORD: password
      SMTP_PORT: 465
      SMTP_TYPE: smtps
      FRONTEND_HOST: your-domain.com/
```

A full list of available environment variables can be found in TODO.

## Start the containers

Once you have configured the environment variables, you can start the LocalCrag application using Docker Compose:

```bash 
docker-compose up -d
```

On first startup, your initial admin user will be created based on the `SUPERADMIN_FIRSTNAME`, `SUPERADMIN_LASTNAME`, and `SUPERADMIN_EMAIL` variables you set in the `docker-compose.override.yml` file.
You will get an E-Mail with the initial password for this user.

## Followups

For production use in a server environment you should follow up with e.g. setting up nginx as a reverse proxy and securing your instance with HTTPS. You can find more information on how to do this in the [Nginx documentation](https://nginx.org/en/docs/).