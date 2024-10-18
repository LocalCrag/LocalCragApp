def test_successful_get_server_health(client, s3_mock, admin_token):
    response = client.get("/api/health", token=admin_token)
    assert response.json == {"server": "healthy", "database": "healthy", "spaces": "healthy"}
    assert response.status_code == 200


def test_get_server_health_unreachable_spaces(client, admin_token):
    response = client.get("/api/health", token=admin_token)
    assert response.json == {"server": "healthy", "database": "healthy", "spaces": "Connection failed"}
    assert response.status_code == 503
