import datetime
from unittest.mock import patch

from models.area import Area
from models.file import File
from models.history_item import HistoryItem
from models.line import Line
from models.topo_image import TopoImage


def test_successful_batch_create_lines(client, moderator_token):
    """Test successful batch creation of topo images and lines."""
    # Get some file IDs for the images
    files = File.query.limit(3).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": "2023-05-15",
        "lines": [
            {
                "name": "Test Boulder 1",
                "color": "#FF0000",
                "startingPosition": "SIT",
                "authorGradeValue": 15,
                "faName": "John Doe",
            },
            {
                "name": "Test Boulder 2",
                "color": "#00FF00",
                "startingPosition": "STAND",
                "authorGradeValue": 18,
                "faName": "Jane Smith",
            },
        ],
    }

    # Count existing topo images and lines
    initial_topo_count = TopoImage.query.count()
    initial_line_count = Line.query.count()
    initial_history_count = HistoryItem.query.count()

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)

    assert rv.status_code == 200
    res = rv.json

    # Check response structure
    assert "lines" in res
    assert "topoImages" in res
    assert len(res["lines"]) == 2
    assert len(res["topoImages"]) == 3

    # Verify lines data
    line1 = res["lines"][0]
    assert line1["name"] == "Test Boulder 1"
    assert line1["color"] == "#FF0000"
    assert line1["type"] == "BOULDER"
    assert line1["gradeScale"] == "FB"
    assert line1["authorGradeValue"] == 15
    assert line1["userGradeValue"] == 15

    line2 = res["lines"][1]
    assert line2["name"] == "Test Boulder 2"
    assert line2["color"] == "#00FF00"
    assert line2["authorGradeValue"] == 18

    # Verify topo images data
    for topo_image in res["topoImages"]:
        assert "id" in topo_image
        assert topo_image["image"]["id"] in file_ids

    # Verify database records were created
    assert TopoImage.query.count() == initial_topo_count + 3
    assert Line.query.count() == initial_line_count + 2
    assert HistoryItem.query.count() == initial_history_count + 2


def test_batch_create_lines_with_project_grades(client, moderator_token):
    """Test batch creation with project grades (-1)."""
    files = File.query.limit(2).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [
            {
                "name": "Project Boulder",
                "color": "#0000FF",
                "startingPosition": "SIT",
                "authorGradeValue": -1,
                "faName": "Unknown",
            }
        ],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)

    assert rv.status_code == 200
    res = rv.json

    line = res["lines"][0]
    assert line["name"] == "Project Boulder"
    assert line["authorGradeValue"] == -1
    assert line["userGradeValue"] == -1


def test_batch_create_lines_without_authentication(client):
    """Test batch creation without authentication should fail."""
    batch_data = {"images": ["some-id"], "gradeScale": "FB", "type": "BOULDER", "faDate": None, "lines": []}

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", json=batch_data)
    assert rv.status_code == 401


def test_batch_create_lines_without_moderator_privileges(client, member_token):
    """Test batch creation without moderator privileges should fail."""
    batch_data = {"images": ["some-id"], "gradeScale": "FB", "type": "BOULDER", "faDate": None, "lines": []}

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=member_token, json=batch_data)
    assert rv.status_code == 401


def test_batch_create_lines_invalid_area(client, moderator_token):
    """Test batch creation with non-existent area should fail."""
    batch_data = {"images": ["some-id"], "gradeScale": "FB", "type": "BOULDER", "faDate": None, "lines": []}

    rv = client.post("/api/areas/non-existent-area/batch-create", token=moderator_token, json=batch_data)
    assert rv.status_code == 404


def test_batch_create_lines_invalid_grade_validation(client, moderator_token):
    """Test batch creation with invalid grade combination should fail."""
    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    # Using FB grade scale with SPORT route type - should fail cross validation
    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",  # Boulder grade scale
        "type": "SPORT",  # Sport route type - mismatch!
        "faDate": None,
        "lines": [{"name": "Invalid Line", "startingPosition": "SIT", "authorGradeValue": 15, "faName": "Test"}],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)
    assert rv.status_code == 400
    assert "Grade scale, value and line type do not match" in rv.json["message"]


def test_batch_create_lines_empty_images_list(client, moderator_token):
    """Test batch creation with empty images list should fail."""
    batch_data = {
        "images": [],  # Empty list should fail validation
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)
    assert rv.status_code == 400


def test_batch_create_lines_invalid_fa_date(client, moderator_token):
    """Test batch creation with future FA date should fail."""
    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    future_date = (datetime.date.today() + datetime.timedelta(days=30)).strftime("%Y-%m-%d")

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": future_date,  # Future date should fail validation
        "lines": [{"name": "Test Line", "startingPosition": "SIT", "authorGradeValue": 15, "faName": "Test"}],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)
    assert rv.status_code == 400


def test_batch_create_lines_invalid_starting_position(client, moderator_token):
    """Test batch creation with invalid starting position should fail."""
    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [
            {
                "name": "Test Line",
                "startingPosition": "INVALID_POSITION",  # Invalid starting position
                "authorGradeValue": 15,
                "faName": "Test",
            }
        ],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)
    assert rv.status_code == 400


def test_batch_create_lines_invalid_color(client, moderator_token):
    """Test batch creation with invalid color format should fail."""
    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [
            {
                "name": "Test Line",
                "color": "invalid_color",  # Invalid color format
                "startingPosition": "SIT",
                "authorGradeValue": 15,
                "faName": "Test",
            }
        ],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)
    assert rv.status_code == 400


def test_batch_create_lines_missing_required_fields(client, moderator_token):
    """Test batch creation with missing required fields should fail."""
    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [
            {
                # Missing name, startingPosition, authorGradeValue, faName
            }
        ],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)
    assert rv.status_code == 400


def test_batch_create_lines_inherits_area_properties(client, moderator_token):
    """Test that created lines inherit secret/closed properties from area."""
    # First, modify the area to be secret and closed
    area = Area.find_by_slug("dritter-block-von-links")
    area.secret = True
    area.closed = True
    area.closed_reason = "Test closure"
    from extensions import db

    db.session.add(area)
    db.session.commit()

    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [
            {"name": "Inherited Props Line", "startingPosition": "SIT", "authorGradeValue": 15, "faName": "Test"}
        ],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)

    assert rv.status_code == 200
    res = rv.json

    # After batch-create, fetch the line details
    line_id = res["lines"][0]["slug"]
    line_detail = client.get(f"/api/lines/{line_id}", token=moderator_token).json

    assert line_detail["secret"] is True
    assert line_detail["closed"] is True
    assert line_detail["closedReason"] == "Test closure"


def test_batch_create_lines_topo_image_order_index(client, moderator_token):
    """Test that topo images are created with correct order indices."""
    # Get current max order index for the area
    area = Area.find_by_slug("dritter-block-von-links")
    initial_max_order = TopoImage.find_max_order_index(area.id)

    files = File.query.limit(2).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {"images": file_ids, "gradeScale": "FB", "type": "BOULDER", "faDate": None, "lines": []}

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)

    assert rv.status_code == 200
    res = rv.json

    # Verify order indices are sequential starting from max + 1
    expected_order = initial_max_order + 1
    for topo_image in res["topoImages"]:
        assert topo_image["orderIndex"] == expected_order
        expected_order += 1


def test_batch_create_lines_line_name_trimming(client, moderator_token):
    """Test that line names are properly trimmed of whitespace."""
    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [
            {
                "name": "   Trimmed Line   ",  # Should be trimmed
                "startingPosition": "SIT",
                "authorGradeValue": 15,
                "faName": "Test",
            }
        ],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)

    assert rv.status_code == 200
    res = rv.json

    line = res["lines"][0]
    assert line["name"] == "Trimmed Line"  # Whitespace should be trimmed


@patch("models.history_item.HistoryItem.create_history_item")
def test_batch_create_lines_history_creation(mock_history, client, moderator_token):
    """Test that history items are created for each line."""
    files = File.query.limit(1).all()
    file_ids = [str(file.id) for file in files]

    batch_data = {
        "images": file_ids,
        "gradeScale": "FB",
        "type": "BOULDER",
        "faDate": None,
        "lines": [{"name": "History Test Line", "startingPosition": "SIT", "authorGradeValue": 15, "faName": "Test"}],
    }

    rv = client.post("/api/areas/dritter-block-von-links/batch-create", token=moderator_token, json=batch_data)

    assert rv.status_code == 200
    # Verify history item creation was called for each line
    assert mock_history.call_count == 1
