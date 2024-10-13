from typing import List

from flask import jsonify, request
from flask.views import MethodView
from sqlalchemy import or_, and_

from error_handling.http_exceptions.bad_request import BadRequest
from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.map_marker_type_enum import (
    disabled_marker_types_crag,
    disabled_marker_types_sector,
    disabled_marker_types_area,
    disabled_marker_types_topo_image,
    MapMarkerType,
)
from models.map_marker import MapMarker
from models.sector import Sector
from models.topo_image import TopoImage
from util.secret_spots_auth import get_show_secret


class GetMarkers(MethodView):

    def get(self):
        """
        Returns a list of map markers. The markers can be configured by query params.
        """
        query_params = request.args
        query = MapMarker.query

        # Show different types of markers based on the parent entity
        # For region (no query params): Show all crags
        # For crag: Show all sectors
        # For sector: Show all areas
        # For area: Show all topo images
        if "area-id" in query_params:
            query = query.filter(
                or_(
                    and_(
                        MapMarker.topo_image.has(area_id=query_params["area-id"]),
                        MapMarker.type == MapMarkerType.TOPO_IMAGE,
                    ),
                    and_(MapMarker.area_id == query_params["area-id"], MapMarker.type != MapMarkerType.AREA),
                )
            )
        elif "sector-id" in query_params:
            query = query.filter(
                or_(
                    and_(MapMarker.area.has(sector_id=query_params["sector-id"]), MapMarker.type == MapMarkerType.AREA),
                    and_(MapMarker.sector_id == query_params["sector-id"], MapMarker.type != MapMarkerType.SECTOR),
                )
            )
        elif "crag-id" in query_params:
            query = query.filter(
                or_(
                    and_(MapMarker.sector.has(crag_id=query_params["crag-id"]), MapMarker.type == MapMarkerType.SECTOR),
                    and_(MapMarker.crag_id == query_params["crag-id"], MapMarker.type != MapMarkerType.CRAG),
                )
            )
        else:
            query = query.filter(MapMarker.type == MapMarkerType.CRAG)
            query = query.join(Crag, MapMarker.crag_id == Crag.id)

        # Filter out secret spots if the user is not allowed to see them
        if not get_show_secret():
            query = query.filter(
                and_(
                    or_(MapMarker.crag.has(secret=False), MapMarker.crag_id.is_(None)),
                    or_(MapMarker.sector.has(secret=False), MapMarker.sector_id.is_(None)),
                    or_(MapMarker.area.has(secret=False), MapMarker.area_id.is_(None)),
                )
            )

        markers: List[MapMarker] = query.all()

        # Convert markers to GeoJSON
        markers_geo_json = {"type": "FeatureCollection", "features": []}
        for marker in markers:
            marker_geo_json = {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [marker.lng, marker.lat]},
                "properties": {
                    "name": marker.name,
                    "description": marker.description,
                    "type": marker.type.value,
                },
            }
            if marker.crag is not None:
                marker_geo_json["properties"]["crag"] = {
                    "id": marker.crag.id,
                    "slug": marker.crag.slug,
                    "name": marker.crag.name,
                    "description": marker.crag.description,
                }
                if marker.type == MapMarkerType.CRAG:
                    marker_geo_json["properties"]["name"] = marker.crag.name
                else:
                    marker_geo_json["properties"]["name"] = marker.name
            if marker.sector is not None:
                marker_geo_json["properties"]["sector"] = {
                    "id": marker.sector.id,
                    "slug": marker.sector.slug,
                    "name": marker.sector.name,
                    "description": marker.sector.description,
                    "crag": {
                        "slug": marker.sector.crag.slug,
                    },
                }
                if marker.type == MapMarkerType.SECTOR:
                    marker_geo_json["properties"]["name"] = marker.sector.name
                else:
                    marker_geo_json["properties"]["name"] = marker.name
            if marker.area is not None:
                marker_geo_json["properties"]["area"] = {
                    "id": marker.area.id,
                    "slug": marker.area.slug,
                    "name": marker.area.name,
                    "description": marker.area.description,
                    "sector": {
                        "slug": marker.area.sector.slug,
                        "crag": {
                            "slug": marker.area.sector.crag.slug,
                        },
                    },
                }
                if marker.type == MapMarkerType.AREA:
                    marker_geo_json["properties"]["name"] = marker.area.name
                else:
                    marker_geo_json["properties"]["name"] = marker.name
            if marker.topo_image is not None:
                marker_geo_json["properties"]["topoImage"] = {
                    "id": marker.topo_image.id,
                    "title": marker.topo_image.title,
                    "description": marker.topo_image.description,
                    "area": {
                        "slug": marker.topo_image.area.slug,
                        "sector": {
                            "slug": marker.topo_image.area.sector.slug,
                            "crag": {
                                "slug": marker.topo_image.area.sector.crag.slug,
                            },
                        },
                    },
                }
                marker_geo_json["properties"]["name"] = marker.topo_image.title
            markers_geo_json["features"].append(marker_geo_json)
        return jsonify(markers_geo_json), 200


def create_or_update_markers(markers_json: List[dict], parent_entity) -> List[MapMarker]:
    """
    Creates or updates a list of map markers. Markers that are no longer in the list are deleted.
    """
    # Topo images can only have one marker
    if parent_entity is TopoImage and len(markers_json) > 1:
        raise BadRequest("Topo images can only have one map marker.")

    # Areas can only have one AREA type map marker
    if parent_entity is Area:
        area_markers_count = sum(1 for marker in markers_json if marker["type"] == MapMarkerType.AREA)
        if area_markers_count > 1:
            raise BadRequest("Areas can only have one AREA type map marker.")

    # Sectors can only have one SECTOR type map marker
    if parent_entity is Sector:
        sector_markers_count = sum(1 for marker in markers_json if marker["type"] == MapMarkerType.SECTOR)
        if sector_markers_count > 1:
            raise BadRequest("Sectors can only have one SECTOR type map marker.")

    # Crags can only have one CRAG type map marker
    if parent_entity is Crag:
        crag_markers_count = sum(1 for marker in markers_json if marker["type"] == MapMarkerType.CRAG)
        if crag_markers_count > 1:
            raise BadRequest("Crags can only have one CRAG type map marker.")

    # Create or update markers
    current_markers: List[MapMarker] = parent_entity.map_markers
    new_markers = []
    for marker_json in markers_json:
        validate_marker_type(marker_json, parent_entity)
        if "id" in marker_json and marker_json["id"]:
            marker = MapMarker.query.filter_by(id=marker_json["id"]).first()
        else:
            marker = MapMarker()
        marker.lat = marker_json["lat"]
        marker.lng = marker_json["lng"]
        marker.name = marker_json["name"]
        marker.description = marker_json["description"]
        marker.type = marker_json["type"]
        new_markers.append(marker)
        db.session.add(marker)

    # Identify the map markers that are no longer in the updated list
    new_marker_ids = {marker.id for marker in new_markers}
    markers_to_delete = [marker for marker in current_markers if marker.id not in new_marker_ids]

    # Delete the map markers that are no longer connected to the entity
    for marker in markers_to_delete:
        db.session.delete(marker)

    return new_markers


def validate_marker_type(marker_json: dict, parent_entity):
    """
    Validates the type of a map marker based on the parent entity.
    """
    if parent_entity is Crag and marker_json["type"] in disabled_marker_types_crag:
        raise BadRequest(f"Map marker type '{marker_json['type']}' is not allowed for crags.")
    if parent_entity is Sector and marker_json["type"] in disabled_marker_types_sector:
        raise BadRequest(f"Map marker type '{marker_json['type']}' is not allowed for sectors.")
    if parent_entity is Area and marker_json["type"] in disabled_marker_types_area:
        raise BadRequest(f"Map marker type '{marker_json['type']}' is not allowed for areas.")
    if parent_entity is TopoImage and marker_json["type"] in disabled_marker_types_topo_image:
        raise BadRequest(f"Map marker type '{marker_json['type']}' is not allowed for topo images.")
