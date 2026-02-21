# LocalCrag Server

## Setup

- Install [pip](https://pip.pypa.io/en/stable/installation/), [pipenv](https://pipenv.pypa.io/en/latest/) and Python (see Python version in Pipfile)
- Install Postgres and create a new database
- Install the server dependencies `pipenv install`
- Create a local config file `src/config/dev.cfg` by copying the config template `src/config/template.cfg` and fill out the appropriate values
    - `SQLALCHEMY_DATABASE_URI` Connection string to your database
    - `SECRET_KEY` Key used for signing session cookies, value irrelevant for local dev
    - `JWT_SECRET_KEY` Key used for signing JWT tokens, irrelevant for local dev
    - `PRINT_MAILS_TO_CONSOLE` If set to True, all mails will be printed to the console instead of sending them. Recommended for local dev.
    - `SYSTEM_EMAIL` E-Mail address the system uses to send mails from
    - `SMTP_HOST` SMTP host address
    - `SMTP_USER` SMTP user
    - `SMTP_PASSWORD` SMTP password
    - `SMTP_PORT` SMTP port
    - `SMTP_TYPE` SMTP type: `smtps`, `starttls`, `plain` or `disabled`
    - `FRONTEND_HOST` Address of the client, used for CORS settings and building URLs in mails
    - `SQLALCHEMY_ECHO` Can be set to True for debugging SQL queries
    - `SUPERADMIN_FIRSTNAME` First name of the initial superadmin user
    - `SUPERADMIN_LASTNAME` Last name of the initial superadmin user
    - `SUPERADMIN_EMAIL` E-Mail address of the initial superadmin user - invitation mail with password will go here
    - `S3_PASSWORD` Password / secret key for the S3 object storage
    - `S3_USER` Username / access key for the S3 object storage
    - `S3_ENDPOINT` S3 object storage endpoint
    - `S3_REGION` S3 object storage region
    - `S3_BUCKET` S3 object storage bucket name
    - `S3_ACCESS_ENDPOINT` Access endpoint of the S3 object storage
    - `S3_ADDRESSING` S3 object storage addressing mode: `virtual` or `path`
    - `SENTRY_DSN` DSN for Sentry error tracking
    - `SENTRY_ENABLED` If set to True, Sentry will be enabled with the configured DSN
- For configuring a local object storage, read `../docs/dev-tooling.md`. This is needed if you are working with fileupload in any way.
- Now you are ready to set up the database of your local dev instance:
  - Set your config env var `LOCALCRAG_CONFIG=config/dev.cfg`
  - Add the postgres uuid extension `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
  - Add the postgres fuzzystrmatch extension `CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;`
  - Run initial database migrations `pipenv run flask db upgrade`
  - The setup script will add some initial data and create your superadmin user. You should receive an email at the configured superadmin mail containing your password.
- If everything worked until here, you should be ready to run the server:
  - Set `PYTHONPATH` to the src directory
  - `pipenv run flask run` 
  - 🧗🚀

## Running tests

- Create a new config file for testing that points to a testing database
- Run [pytest](https://docs.pytest.org/en/7.1.x/how-to/usage.html) using the new config in the `/tests` directory