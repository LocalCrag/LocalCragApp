from util.localcrag_product import LOCALCRAG_PRODUCT, LOCALCRAG_VERSION


def test_successful_get_server_health(client, s3_mock, admin_token):
    response = client.get("/api/health", token=admin_token)
    assert response.json == {
        "server": "healthy",
        "database": "healthy",
        "s3": "healthy",
        "product": LOCALCRAG_PRODUCT,
        "version": LOCALCRAG_VERSION,
    }
    assert response.status_code == 200


def test_get_server_health_unreachable_s3(client, admin_token):
    response = client.get("/api/health", token=admin_token)
    assert response.json == {
        "server": "healthy",
        "database": "healthy",
        "s3": "Connection failed",
        "product": LOCALCRAG_PRODUCT,
        "version": LOCALCRAG_VERSION,
    }
    assert response.status_code == 503


def test_health_always_includes_localcrag_identity(client, s3_mock, admin_token):
    response = client.get("/api/health", token=admin_token)
    assert response.json["product"] == "localcrag"
    assert isinstance(response.json["version"], str)
    assert response.json["version"]
