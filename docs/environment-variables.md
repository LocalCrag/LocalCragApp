# Environment Variables

This document provides an overview of the environment variables used in the application. Each variable is described with its type, possible values, and purpose.

| **Variable**               | **Type (Possible Values)**                                | **Description**                                                                            |
|----------------------------|-----------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `SQLALCHEMY_DATABASE_URI`  | `string` (e.g., `postgresql://user:password@host/dbname`) | Database connection string for SQLAlchemy.                                                 |
| `SECRET_KEY`               | `string`                                                  | Secret key used for application security.                                                  |
| `JWT_SECRET_KEY`           | `string`                                                  | Secret key used for signing JSON Web Tokens (JWT).                                         |
| `SYSTEM_EMAIL`             | `string` (e.g., `noreply@example.com`)                    | Email address used for system notifications.                                               |
| `SMTP_HOST`                | `string` (e.g., `smtp.example.com`)                       | Hostname of the SMTP server.                                                               |
| `SMTP_USER`                | `string`                                                  | Username for the SMTP server.                                                              |
| `SMTP_PASSWORD`            | `string`                                                  | Password for the SMTP server.                                                              |
| `SMTP_PORT`                | `integer` (e.g., `465`, `587`)                            | Port number for the SMTP server.                                                           |
| `SMTP_TYPE`                | `string` (`smtps`, `starttls`, `plain`, `disabled`)       | Type of SMTP connection. If set to disabled, no emails are sent.                           |
| `SPACES_SECRET_KEY`        | `string`                                                  | Secret key for accessing object storage (e.g., MinIO or S3).                               |
| `SPACES_ACCESS_KEY`        | `string`                                                  | Access key for object storage.                                                             |
| `SPACES_ENDPOINT`          | `string` (e.g., `https://s3.example.com`)                 | Endpoint URL for object storage.                                                           |
| `SPACES_REGION`            | `string` (e.g., `us-east-1`)                              | Region for object storage.                                                                 |
| `SPACES_BUCKET`            | `string`                                                  | Name of the bucket in object storage.                                                      |
| `SPACES_ACCESS_ENDPOINT`   | `string` (e.g., `http://localhost:9000`)                  | Endpoint for accessing object storage from the client (may differ from `SPACES_ENDPOINT`). |
| `SPACES_ADDRESSING`        | `string` (`path`, `virtual`)                              | Addressing style for object storage (path-based or virtual-hosted).                        |
| `FRONTEND_HOST`            | `string` (e.g., `http://localhost:4200/`)                 | URL of the frontend application.                                                           |
| `SENTRY_DSN`               | `string`                                                  | Data Source Name (DSN) for Sentry error tracking.                                          |
| `SENTRY_ENABLED`           | `boolean` (`true`, `false`)                               | Flag to enable or disable Sentry integration.                                              |
| `CRON_ACCESS_TOKEN`        | `string`                                                  | Access token for securing cron job endpoints.                                              |
| `SUPERADMIN_EMAIL`         | `string` (e.g., `admin@example.com`)                      | Email address of the initial superadmin user.                                              |
| `SUPERADMIN_FIRSTNAME`     | `string`                                                  | First name of the initial superadmin user.                                                 |
| `SUPERADMIN_LASTNAME`      | `string`                                                  | Last name of the initial superadmin user.                                                  |