# Base image
FROM python:3.11-buster

# Create directory that will install the dependencies in it
RUN mkdir -p /usr/src/app

# Update working directory
WORKDIR /usr/src/app

# Install pipenv
RUN pip install pipenv

# Copy pipenv files
COPY Pipfile Pipfile.lock ./

# Install the dependencies
RUN pipenv install --system --deploy --ignore-pipfile

# Add the app files in the container
COPY . .

# Give execute permission to the entrypoint.sh file
RUN chmod 777 ./src/config_docker/entrypoint.sh

# Set working directory
WORKDIR /usr/src/app/src

# Set the environment variables
ENV RUN_SCHEDULERS=False
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=.

# Exposes the port in the container
EXPOSE 5000

# Set the entrypoint file
ENTRYPOINT [ "./entrypoint.sh" ]