# This Dockerfile is used to build the localcragapp images for development purposes
# For production separate Dockerfiles are provided in the server and client directories

FROM python AS localcragapp-server
RUN pip install pipenv
ENV PYTHONPATH=/localcragapp/src
RUN mkdir /.local && chown 1000:1000 /.local
RUN echo 'alias pytest="SQLALCHEMY_DATABASE_URI=${SQLALCHEMY_DATABASE_URI}_test LOCALCRAG_CONFIG=/localcragapp/src/config/test-ci.cfg env -u SPACES_SECRET_KEY -u SPACES_ACCESS_KEY -u SPACES_ENDPOINT -u SPACES_ACCESS_ENDPOINT -u SPACES_REGION -u SPACES_BUCKET -u SPACES_ADDRESSING -u SMTP_HOST -u SMTP_USER -u SMTP_PASSWORD -u SMTP_PORT -u SMTP_TYPE pipenv run pytest"' >> /tmp/aliases && \
    echo 'alias flake8="pipenv run flake8"' >> /tmp/aliases && \
    echo 'alias black="pipenv run black --config=/localcragapp/pyproject.toml"' >> /tmp/aliases && \
    echo 'alias isort="pipenv run isort --settings-path=/localcragapp/pyproject.toml"' >> /tmp/aliases && \
    cat /tmp/aliases >> /etc/profile && \
    cat /tmp/aliases >> /etc/bash.bashrc
USER 1000:1000
WORKDIR /localcragapp
COPY ./server/.flake8 /localcragapp/.flake8
COPY ./server/pyproject.toml /localcragapp/pyproject.toml
COPY ./server/Pipfile /localcragapp/Pipfile
COPY ./server/Pipfile.lock /localcragapp/Pipfile.lock
RUN pipenv install --dev
USER root
RUN chown -R 1000:1000 /localcragapp
USER 1000:1000
WORKDIR /localcragapp/src

FROM node AS localcragapp-client
USER 1000:1000
WORKDIR /localcragapp
COPY ./client .
USER root
RUN chown -R 1000:1000 /localcragapp
USER 1000:1000
RUN npm ci --include dev
