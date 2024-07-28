import json

from models.enums.todo_priority_enum import TodoPriorityEnum
from tests.utils.user_test_util import get_login_headers


def test_successful_add_todo(client):
    access_headers, refresh_headers = get_login_headers(client)
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201
    res = json.loads(rv.data)
    assert res['line']['id'] == "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0"
    assert res['priority'] == TodoPriorityEnum.MEDIUM.value
    assert res['sector']['name'] == "Schattental"
    assert res['area']['name'] == "Dritter Block von links"
    assert res['crag']['name'] == "Brione"


def test_try_adding_todo_twice(client):
    access_headers, refresh_headers = get_login_headers(client)
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == 'Cannot add a line as todo twice.'


def test_try_adding_a_climbed_line_as_todo(client):
    access_headers, refresh_headers = get_login_headers(client)
    todo_data = {
        "line": "1c39fd1f-6341-4161-a83f-e5de0f861c48",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 400
    res = json.loads(rv.data)
    assert res['message'] == 'Cannot add a line as todo if already climbed.'


def test_successful_get_todos(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201

    # Then get the list
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 1
    assert res['items'][0]['line']['id'] == "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0"
    assert res['items'][0]['priority'] == TodoPriorityEnum.MEDIUM.value
    assert res['items'][0]['sector']['name'] == "Schattental"
    assert res['items'][0]['area']['name'] == "Dritter Block von links"
    assert res['items'][0]['crag']['name'] == "Brione"

    # Test the grade filter: set min grade to 10, should return no to-do
    rv = client.get('/api/todos?page=1&min_grade=10&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 0

    # Test the crag filter, set crag to chironico, should return no to-do
    rv = client.get(
        '/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10&crag_id=6b9e873b-e48d-4f0e-9d86-c3b6d7aa9db0',
        headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 0

    # Now set it to brione, should return one to-do
    rv = client.get(
        '/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10&crag_id=aabc4539-c02f-4a03-8db3-ea0916e59884',
        headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 1


def test_successful_update_todo_priority(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201
    todo_id = json.loads(rv.data)['id']

    # Then update the priority
    update_data = {
        "priority": TodoPriorityEnum.HIGH.value,
    }

    rv = client.put('/api/todos/{}/update-priority'.format(todo_id), headers=access_headers, json=update_data)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res['priority'] == TodoPriorityEnum.HIGH.value


def test_successful_delete_todo(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201
    todo_id = json.loads(rv.data)['id']

    # Then delete it
    rv = client.delete('/api/todos/{}'.format(todo_id), headers=access_headers)
    assert rv.status_code == 204

    # Then try to get it, should return 404
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 0


def test_try_getting_todos_of_another_user(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201

    # Then login with another user
    access_headers, refresh_headers = get_login_headers(client, email='localcrag2@fengelmann.de')

    # List of todos should be empty
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 0


def test_try_deleting_todos_of_another_user(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201
    todo_id = json.loads(rv.data)['id']

    # Then login with another user
    access_headers, refresh_headers = get_login_headers(client, email='localcrag2@fengelmann.de')

    # Try to delete the to-do
    rv = client.delete('/api/todos/{}'.format(todo_id), headers=access_headers)
    assert rv.status_code == 400


def test_try_updating_todo_priority_of_another_user(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201
    todo_id = json.loads(rv.data)['id']

    # Then login with another user
    access_headers, refresh_headers = get_login_headers(client, email='localcrag2@fengelmann.de')

    # Try to update the priority
    update_data = {
        "priority": TodoPriorityEnum.HIGH.value,
    }
    rv = client.put('/api/todos/{}/update-priority'.format(todo_id), headers=access_headers, json=update_data)
    assert rv.status_code == 400


def test_try_adding_todo_with_invalid_line_id(client):
    access_headers, refresh_headers = get_login_headers(client)
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba1",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 404
    res = json.loads(rv.data)
    assert res['message'] == 'ENTITY_NOT_FOUND'


def test_try_updating_priority_with_invalid_priority(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201
    todo_id = json.loads(rv.data)['id']

    # Then update the priority
    update_data = {
        "priority": "INVALID_PRIORITY",
    }

    rv = client.put('/api/todos/{}/update-priority'.format(todo_id), headers=access_headers, json=update_data)
    assert rv.status_code == 400


def test_get_is_todo(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
    assert rv.status_code == 201

    # Then get the is_todo
    rv = client.get('/api/is-todo?user_id=1543885f-e9ef-48c5-a396-6c898fb42409&line_ids=9d64b102-95cd-4123-a2d1-4bb1f7c77ba0', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert res[0] == '9d64b102-95cd-4123-a2d1-4bb1f7c77ba0'

    # Test for different line id
    rv = client.get('/api/is-todo?user_id=1543885f-e9ef-48c5-a396-6c898fb42409&line_ids=1c39fd1f-6341-4161-a83f-e5de0f861c48', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 0

    # Test for different user id
    rv = client.get('/api/is-todo?user_id=4543885f-e9ef-48c5-a396-6c898fb42409&line_ids=9d64b102-95cd-4123-a2d1-4bb1f7c77ba0', headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res) == 0


def test_creating_an_ascent_for_a_line_that_is_todo_removed_the_todo(client):
    access_headers, refresh_headers = get_login_headers(client)

    # Add a to-do first
    todo_data = {
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
    }

    rv = client.post('/api/todos', headers=access_headers, json=todo_data)
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
        "line": "9d64b102-95cd-4123-a2d1-4bb1f7c77ba0",
        "date": "2024-04-13"
    }

    rv = client.post('/api/ascents', headers=access_headers, json=ascent_data)
    assert rv.status_code == 201

    # Then get the list of todos, should be empty
    rv = client.get('/api/todos?page=1&min_grade=0&max_grade=28&order_by=grade_value&order_direction=desc&per_page=10',
                    headers=access_headers)
    assert rv.status_code == 200
    res = json.loads(rv.data)
    assert len(res['items']) == 0