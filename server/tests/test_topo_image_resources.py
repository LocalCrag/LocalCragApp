from models.enums.map_marker_type_enum import MapMarkerType
from models.file import File
from models.topo_image import TopoImage


def test_successful_edit_topo_image(client, moderator_token):
    topo_image = TopoImage.query.first()
    any_file_id = str(File.query.filter(File.id != topo_image.file_id).first().id)
    
    topo_image_data = {
        "image": any_file_id,
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.TOPO_IMAGE.value,
                "description": None,
                "name": None,
            }
        ],
        "title": 'Geiler Block',
        "description": 'Ein wahrhaft geiler Block!'
    }

    rv = client.put(f'/api/topo-images/{topo_image.id}', token=moderator_token, json=topo_image_data)
    assert rv.status_code == 200
    res = rv.json
    assert res['image']['id'] != str(topo_image.file_id)  # Image ID on update must be ignored!
    assert res['mapMarkers'][0]['lat'] == 12.13
    assert res['mapMarkers'][0]['lng'] == 42.42
    assert res['mapMarkers'][0]['type'] == MapMarkerType.TOPO_IMAGE.value
    assert res['title'] == 'Geiler Block'
    assert res['description'] == 'Ein wahrhaft geiler Block!'
    assert res['id'] == str(topo_image.id)


def test_successful_add_topo_image(client, moderator_token):
    any_file_id = str(File.query.first().id)

    topo_image_data = {
        "image": any_file_id,
        "mapMarkers": [
            {
                "lat": 12.13,
                "lng": 42.42,
                "type": MapMarkerType.TOPO_IMAGE.value,
                "description": None,
                "name": None,
            }
        ],
        "title": 'Geiler Block',
        "description": 'Ein wahrhaft geiler Block!'
    }
    rv = client.post('/api/areas/dritter-block-von-links/topo-images', token=moderator_token, json=topo_image_data)
    assert rv.status_code == 201
    res = rv.json
    assert type(res['id']) == str
    assert res['image']['id'] == any_file_id
    assert res['mapMarkers'][0]['lat'] == 12.13
    assert res['mapMarkers'][0]['lng'] == 42.42
    assert res['mapMarkers'][0]['type'] == MapMarkerType.TOPO_IMAGE.value
    assert res['title'] == 'Geiler Block'
    assert res['description'] == 'Ein wahrhaft geiler Block!'
    assert len(res['linePaths']) == 0


def test_successful_get_topo_images(client):
    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = rv.json
    assert len(res) == 2
    assert isinstance(res[0]['id'], str)
    assert res[0]['image']['id'] == str(File.query.filter_by(original_filename="Love it or leave it.JPG").first().id)
    assert res[0]['orderIndex'] == 0
    assert len(res[0]['mapMarkers']) == 0
    assert res[0]['title'] is None
    assert res[0]['description'] is None
    assert res[1]['orderIndex'] == 1
    assert len(res[0]['linePaths'][0]['path']) == 8


def test_successful_get_topo_image(client):
    topo_image = TopoImage.query.first()

    rv = client.get(f'/api/topo-images/{topo_image.id}')
    assert rv.status_code == 200
    res = rv.json
    assert res['id'] == str(topo_image.id)
    assert res['image']['id'] == str(topo_image.file_id)
    assert len(res['mapMarkers']) == 0
    assert res['title'] is None
    assert res['description'] is None
    assert len(res['linePaths'][0]['path']) == 8


def test_successful_delete_topo_image(client, moderator_token):
    topo_image = TopoImage.query.first()

    rv = client.delete(f'/api/topo-images/{topo_image.id}', token=moderator_token)
    assert rv.status_code == 204


def test_successful_order_topo_images(client, moderator_token):
    topo_images = TopoImage.query.all()

    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = rv.json
    assert res[0]['id'] == str(topo_images[0].id)
    assert res[0]['orderIndex'] == 0
    assert res[1]['id'] == str(topo_images[1].id)
    assert res[1]['orderIndex'] == 1

    new_order = {
        str(topo_images[0].id): 1,
        str(topo_images[1].id): 0,
    }
    rv = client.put('/api/areas/dritter-block-von-links/topo-images/update-order', token=moderator_token,
                    json=new_order)
    assert rv.status_code == 200

    rv = client.get('/api/areas/dritter-block-von-links/topo-images')
    assert rv.status_code == 200
    res = rv.json
    assert res[0]['id'] == str(topo_images[1].id)
    assert res[0]['orderIndex'] == 0
    assert res[1]['id'] == str(topo_images[0].id)
    assert res[1]['orderIndex'] == 1
