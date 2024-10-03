FROM python AS localcragapp-server
RUN pip install pipenv
ENV PYTHONPATH=/localcragapp/src
RUN mkdir /.local && chown 1000:1000 /.local
RUN echo 'alias pytest="SQLALCHEMY_DATABASE_URI=${SQLALCHEMY_DATABASE_URI}_test LOCALCRAG_CONFIG=/localcragapp/src/config/test-ci.cfg pipenv run pytest"' >> /etc/profile && \
    echo 'alias pytest="SQLALCHEMY_DATABASE_URI=${SQLALCHEMY_DATABASE_URI}_test LOCALCRAG_CONFIG=/localcragapp/src/config/test-ci.cfg pipenv run pytest"' >> /etc/bash.bashrc
USER 1000:1000
WORKDIR /localcragapp
COPY ./server/Pipfile /localcragapp/Pipfile
COPY ./server/Pipfile.lock /localcragapp/Pipfile.lock
RUN pipenv install
WORKDIR /localcragapp/src

FROM node AS localcragapp-client
USER 1000:1000
WORKDIR /localcragapp
COPY ./client .
RUN npm ci
