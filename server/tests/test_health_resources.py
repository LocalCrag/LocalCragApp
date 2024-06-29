import json
from datetime import datetime, timedelta
from uuid import uuid4

import pytz

from app import app
from extensions import db
from messages.messages import ResponseMessage
from models.user import User
from tests.utils.user_test_util import get_login_headers


def test_successful_get_server_health(client, s3_mock):
    access_headers, refresh_headers = get_login_headers(client)
    response = client.get('/api/health', headers=access_headers)
    assert response.json == {
        "server": "healthy",
        "database": "healthy",
        "spaces": "healthy"
    }
    assert response.status_code == 200


def test_get_server_health_unreachable_spaces(client):
    access_headers, refresh_headers = get_login_headers(client)
    response = client.get('/api/health', headers=access_headers)
    assert response.json == {
        "server": "healthy",
        "database": "healthy",
        "spaces": "Connection failed"
    }
    assert response.status_code == 503
