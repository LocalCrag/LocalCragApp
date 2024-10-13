from models.crag import Crag
from models.enums.todo_priority_enum import TodoPriorityEnum
from models.line import Line
from models.user import User
from tests.conftest import user_token


def test_successful_add_todo(client, user_token):
    line_id = Line.get_id_by_slug("treppe")
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201
    res = rv.json
    assert res['line']['id'] == str(line_id)
    assert res['priority'] == TodoPriorityEnum.MEDIUM.value
    assert res['sector']['name'] == "Schattental"
    assert res['area']['name'] == "Dritter Block von links"
    assert res['crag']['name'] == "Brione"


def test_try_adding_todo_twice(client, user_token):
    line_id = Line.get_id_by_slug("treppe")
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 400
    res = rv.json
    assert res['message'] == 'Cannot add a line as todo twice.'


def test_try_adding_a_climbed_line_as_todo(client, admin_token):
    line_id = Line.get_id_by_slug("super-spreader")
    todo_data = {
        "line": line_id,
    }

    rv = client.post('/api/todos', token=admin_token, json=todo_data)
    assert rv.status_code == 400
    res = rv.json
    assert res['message'] == 'Cannot add a line as todo if already climbed.'


def test_successful_get_todos(client, user_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201

    # Then get the list
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res['items']) == 1
    assert res['items'][0]['line']['id'] == str(line_id)
    assert res['items'][0]['priority'] == TodoPriorityEnum.MEDIUM.value
    assert res['items'][0]['sector']['name'] == "Schattental"
    assert res['items'][0]['area']['name'] == "Dritter Block von links"
    assert res['items'][0]['crag']['name'] == "Brione"

    # Test the grade filter: set min grade to 10, should return no to-do
    rv = client.get('/api/todos?page=1&min_grade=10&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res['items']) == 0

    # Test the crag filter, set crag to chironico, should return no to-do
    rv = client.get(
        f'/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10&crag_id={Crag.get_id_by_slug("chironico")}',
        token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res['items']) == 0

    # Now set it to brione, should return one to-do
    rv = client.get(
        f'/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10&crag_id={Crag.get_id_by_slug("brione")}',
        token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res['items']) == 1


def test_successful_update_todo_priority(client, user_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201
    todo_id = rv.json['id']

    # Then update the priority
    update_data = {
        "priority": TodoPriorityEnum.HIGH.value,
    }

    rv = client.put(f'/api/todos/{todo_id}/update-priority', token=user_token, json=update_data)
    assert rv.status_code == 200
    res = rv.json
    assert res['priority'] == TodoPriorityEnum.HIGH.value


def test_successful_delete_todo(client, user_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201
    todo_id = rv.json['id']

    # Then delete it
    rv = client.delete(f'/api/todos/{todo_id}', token=user_token)
    assert rv.status_code == 204

    # Then try to get it, should return 404
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res['items']) == 0


def test_try_getting_todos_of_another_user(client, user_token, member_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201

    # List of todos should be empty
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    token=member_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res['items']) == 0


def test_try_deleting_todos_of_another_user(client, user_token, member_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201
    todo_id = rv.json['id']

    # Try to delete the to-do
    rv = client.delete(f'/api/todos/{todo_id}', token=member_token)
    assert rv.status_code == 400


def test_try_updating_todo_priority_of_another_user(client, user_token, member_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201
    todo_id = rv.json['id']

    # Try to update the priority
    update_data = {
        "priority": TodoPriorityEnum.HIGH.value,
    }
    rv = client.put(f'/api/todos/{todo_id}/update-priority', token=member_token, json=update_data)
    assert rv.status_code == 400


def test_try_adding_todo_with_invalid_line_id(client, user_token):
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba1",
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 404
    res = rv.json
    assert res['message'] == 'ENTITY_NOT_FOUND'


def test_try_updating_priority_with_invalid_priority(client, user_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201
    todo_id = rv.json['id']

    # Then update the priority
    update_data = {
        "priority": "INVALID_PRIORITY",
    }

    rv = client.put(f'/api/todos/{todo_id}/update-priority', token=user_token, json=update_data)
    assert rv.status_code == 400


def test_get_is_todo(client, user_token):
    line_id = Line.get_id_by_slug("treppe")
    line2_id = Line.get_id_by_slug("super-spreader")
    user_id = User.get_id_by_slug("user-user")
    member_id = User.get_id_by_slug("member-member")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201

    # Then get the is_todo
    rv = client.get(f'/api/is-todo?user_id={user_id}&line_ids={line_id}', token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert res[0] == str(line_id)

    # Test for different line id
    rv = client.get(f'/api/is-todo?user_id={user_id}&line_ids={line2_id}', token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 0

    # Test for different user id
    rv = client.get(f'/api/is-todo?user_id={member_id}&line_ids={line_id}', token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 0


def test_creating_an_ascent_for_a_line_that_is_todo_removed_the_todo(client, user_token):
    line_id = Line.get_id_by_slug("treppe")

    # Add a to-do first
    todo_data = {
        "line": str(line_id),
    }

    rv = client.post('/api/todos', token=user_token, json=todo_data)
    assert rv.status_code == 201

    # Then create an ascent
    ascent_data = {
        "flash": True,
        "fa": False,
        "soft": True,
        "hard": False,
        "withKneepad": True,
        "rating": 2,
        "comment": "Hahahahaha",
        "year": None,
        "gradeScale": "FB",
        "gradeName": "6A",
        "line": str(line_id),
        "date": "2024-04-13"
    }

    rv = client.post('/api/ascents', token=user_token, json=ascent_data)
    assert rv.status_code == 201

    # Then get the list of todos, should be empty
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    token=user_token)
    assert rv.status_code == 200
    res = rv.json
    assert len(res['items']) == 0
