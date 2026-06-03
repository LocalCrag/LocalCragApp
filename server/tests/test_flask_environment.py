import os
from unittest.mock import patch

from flask import Flask

from app import app
from util.flask_environment import is_development_mode


def test_is_development_mode_production():
    with patch.dict(os.environ, {"FLASK_ENV": "production"}, clear=False):
        assert is_development_mode(app) is False


def test_is_development_mode_flask_env_development():
    with patch.dict(os.environ, {"FLASK_ENV": "development"}, clear=False):
        assert is_development_mode(app) is True


def test_is_development_mode_flask_debug(monkeypatch):
    monkeypatch.delenv("FLASK_ENV", raising=False)
    debug_app = Flask(__name__)
    debug_app.config["DEBUG"] = True
    assert is_development_mode(debug_app) is True
