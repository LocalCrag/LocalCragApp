import pytest

from config.validate_config import normalize_config_urls


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("http://localhost:4200", "http://localhost:4200"),
        ("http://localhost:4200/", "http://localhost:4200"),
        ("http://localhost:4200///", "http://localhost:4200"),
    ],
)
def test_normalize_frontend_host(raw, expected):
    config = {"FRONTEND_HOST": raw}
    normalize_config_urls(config)
    assert config["FRONTEND_HOST"] == expected


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("http://storage:9000", "http://storage:9000"),
        ("http://storage:9000/", "http://storage:9000"),
        ("https://s3.example.com///", "https://s3.example.com"),
    ],
)
def test_normalize_s3_endpoints(raw, expected):
    config = {"S3_ENDPOINT": raw, "S3_ACCESS_ENDPOINT": raw}
    normalize_config_urls(config)
    assert config["S3_ENDPOINT"] == expected
    assert config["S3_ACCESS_ENDPOINT"] == expected


def test_normalize_s3_endpoints_none_unchanged():
    config = {"S3_ENDPOINT": None, "S3_ACCESS_ENDPOINT": None}
    normalize_config_urls(config)
    assert config["S3_ENDPOINT"] is None
    assert config["S3_ACCESS_ENDPOINT"] is None
