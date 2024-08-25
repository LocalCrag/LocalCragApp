from typing import List

from flask import jsonify, request
from flask.views import MethodView

from extensions import db
from models.crag import Crag
from models.map_marker import MapMarker


class GetMarkers(MethodView):

    def get(self):
        """
        Returns a list of map markers. The markers can be configured by query params.
        """
        query_params = request.args
        query = MapMarker.query

        # TODO add secret filter

        if 'type' in query_params:
            query = query.filter_by(type=query_params['type'])
        if 'topo_image_id' in query_params:
            query = query.filter_by(topo_image_id=query_params['topo_image_id'])
        if 'area_id' in query_params:
            query = query.filter_by(area_id=query_params['area_id'])
        if 'sector_id' in query_params:
            query = query.filter_by(sector_id=query_params['sector_id'])
        if 'crag_id' in query_params:
            query = query.filter_by(crag_id=query_params['crag_id'])
            query = query.join(Crag, MapMarker.crag_id == Crag.id)

        markers: List[MapMarker] = query.all()

        # Convert markers to GeoJSON
        markers_geo_json = {
            "type": "FeatureCollection",
            "features": []
        }
        for marker in markers:
            marker_geo_json = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [marker.lng, marker.lat]
                },
                "properties": {
                    "name": marker.name,
                    "description": marker.description,
                    "type": marker.type.value,
                }
            }
            if marker.crag is not None:
                marker_geo_json["properties"]["crag"] = {
                    "id": marker.crag.id,
                    "slug": marker.crag.slug,
                    "name": marker.crag.name,
                    "description": marker.crag.description
                }
                marker_geo_json["properties"]["name"] = marker.crag.name
            markers_geo_json["features"].append(marker_geo_json)
        return jsonify(markers_geo_json), 200

def create_or_update_markers(markers_json: List[dict]) -> List[MapMarker]:
    """
    Creates or updates a list of map markers.
    """
    # TODO validate type - cannot be sector for crags. Cannot be anything for topo images but topo image
    markers = []
    for marker_json in markers_json:
        if 'id' in marker_json and  marker_json['id']:
            marker = MapMarker.query.filter_by(id=marker_json['id']).first()
        else:
            marker = MapMarker()
        marker.lat = marker_json['lat']
        marker.lng = marker_json['lng']
        marker.name = marker_json['name']
        marker.description = marker_json['description']
        marker.type = marker_json['type']
        markers.append(marker)
        db.session.add(marker)
    return markers