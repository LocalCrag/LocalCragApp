"""Load published topo rows for the quality report."""

from __future__ import annotations

from extensions import db
from models.area import Area
from models.crag import Crag
from models.enums.map_marker_type_enum import MapMarkerType
from models.enums.publication_status_enum import PublicationStatusEnum
from models.line import Line
from models.line_path import LinePath
from models.map_marker import MapMarker
from models.region import Region
from models.secret_topo_entity import SecretTopoEntity
from models.sector import Sector
from models.topo_image import TopoImage
from util.topo_quality_score import (
    LineRecord,
    SpotRecord,
    TopoRecord,
    fa_complete,
    has_text,
    has_video,
    is_styled,
)

_GPS_TYPE = {
    "crag": MapMarkerType.CRAG,
    "sector": MapMarkerType.SECTOR,
    "area": MapMarkerType.AREA,
}


def load_quality_snapshot(
    exclude_secret: bool, gym: bool
) -> tuple[str, list[SpotRecord], list[LineRecord], list[TopoRecord]]:
    secret_ids = set()
    if exclude_secret:
        secret_ids = {row[0] for row in db.session.query(SecretTopoEntity.entity_id).all()}

    crags = (
        Crag.query.filter(Crag.publication_status == PublicationStatusEnum.PUBLISHED)
        .order_by(Crag.order_index.asc(), Crag.name.asc())
        .all()
    )
    sectors = (
        Sector.query.filter(Sector.publication_status == PublicationStatusEnum.PUBLISHED)
        .order_by(Sector.order_index.asc(), Sector.name.asc())
        .all()
    )
    areas = (
        Area.query.filter(Area.publication_status == PublicationStatusEnum.PUBLISHED)
        .order_by(Area.order_index.asc(), Area.name.asc())
        .all()
    )

    visible_crags = [crag for crag in crags if crag.id not in secret_ids]
    visible_crag_ids = {crag.id for crag in visible_crags}
    visible_sectors = [
        sector for sector in sectors if sector.crag_id in visible_crag_ids and sector.id not in secret_ids
    ]
    visible_sector_ids = {sector.id for sector in visible_sectors}
    visible_areas = [area for area in areas if area.sector_id in visible_sector_ids and area.id not in secret_ids]
    visible_area_ids = {area.id for area in visible_areas}

    crag_by_id = {crag.id: crag for crag in visible_crags}
    sector_by_id = {sector.id: sector for sector in visible_sectors}

    marker_flags = _marker_flags()
    spots = []
    for crag in visible_crags:
        gps, parking = marker_flags.get(("crag", crag.id), (False, False))
        spots.append(
            SpotRecord(
                id=str(crag.id),
                name=crag.name,
                slug=crag.slug,
                level="crag",
                parent_id=None,
                crag_slug=crag.slug,
                sector_slug=None,
                area_slug=None,
                crag_name=crag.name,
                order_index=crag.order_index or 0,
                created_by_id=str(crag.created_by_id) if crag.created_by_id else None,
                published=True,
                has_gps=gps,
                has_parking=parking,
                has_description=has_text(crag.description) or has_text(crag.short_description),
                has_image=crag.portrait_image_id is not None,
            )
        )
    for sector in visible_sectors:
        crag = crag_by_id[sector.crag_id]
        gps, parking = marker_flags.get(("sector", sector.id), (False, False))
        spots.append(
            SpotRecord(
                id=str(sector.id),
                name=sector.name,
                slug=sector.slug,
                level="sector",
                parent_id=str(sector.crag_id),
                crag_slug=crag.slug,
                sector_slug=sector.slug,
                area_slug=None,
                crag_name=crag.name,
                sector_name=sector.name,
                order_index=sector.order_index or 0,
                created_by_id=str(sector.created_by_id) if sector.created_by_id else None,
                published=True,
                has_gps=gps,
                has_parking=parking,
                has_description=has_text(sector.description) or has_text(sector.short_description),
                has_image=sector.portrait_image_id is not None,
            )
        )
    for area in visible_areas:
        sector = sector_by_id[area.sector_id]
        crag = crag_by_id[sector.crag_id]
        gps, parking = marker_flags.get(("area", area.id), (False, False))
        spots.append(
            SpotRecord(
                id=str(area.id),
                name=area.name,
                slug=area.slug,
                level="area",
                parent_id=str(area.sector_id),
                crag_slug=crag.slug,
                sector_slug=sector.slug,
                area_slug=area.slug,
                crag_name=crag.name,
                sector_name=sector.name,
                area_name=area.name,
                order_index=area.order_index or 0,
                created_by_id=str(area.created_by_id) if area.created_by_id else None,
                published=True,
                has_gps=gps,
                has_parking=parking,
                has_description=has_text(area.description) or has_text(area.short_description),
                has_image=area.portrait_image_id is not None,
            )
        )

    drawn_line_ids = {row[0] for row in db.session.query(LinePath.line_id).distinct().all()}
    gps_topo_ids = {
        row[0]
        for row in db.session.query(MapMarker.topo_image_id)
        .filter(
            MapMarker.topo_image_id.isnot(None),
            MapMarker.lat.isnot(None),
            MapMarker.lng.isnot(None),
        )
        .distinct()
        .all()
    }

    area_path = {}
    for area in visible_areas:
        sector = sector_by_id[area.sector_id]
        crag = crag_by_id[sector.crag_id]
        area_path[area.id] = (crag.slug, sector.slug, area.slug, crag.name, sector.name, area.name)

    lines = []
    if visible_area_ids:
        for line in Line.query.filter(
            Line.publication_status == PublicationStatusEnum.PUBLISHED,
            Line.area_id.in_(visible_area_ids),
        ).all():
            if line.id in secret_ids:
                continue
            crag_slug, sector_slug, area_slug, crag_name, sector_name, area_name = area_path[line.area_id]
            lines.append(
                LineRecord(
                    id=str(line.id),
                    name=line.name,
                    slug=line.slug,
                    area_id=str(line.area_id),
                    crag_slug=crag_slug,
                    sector_slug=sector_slug,
                    area_slug=area_slug,
                    crag_name=crag_name,
                    sector_name=sector_name,
                    area_name=area_name,
                    created_by_id=str(line.created_by_id) if line.created_by_id else None,
                    time_created=line.time_created,
                    published=True,
                    drawn=line.id in drawn_line_ids,
                    styled=is_styled(line),
                    has_video=has_video(line.videos),
                    fa_complete=fa_complete(line, gym),
                    has_description=has_text(line.description),
                )
            )

    topos = []
    if visible_area_ids:
        for image in TopoImage.query.filter(
            TopoImage.publication_status == PublicationStatusEnum.PUBLISHED,
            TopoImage.area_id.in_(visible_area_ids),
        ).all():
            crag_slug, sector_slug, area_slug, crag_name, sector_name, area_name = area_path[image.area_id]
            topos.append(
                TopoRecord(
                    id=str(image.id),
                    name=(image.title or "").strip(),
                    area_id=str(image.area_id),
                    crag_slug=crag_slug,
                    sector_slug=sector_slug,
                    area_slug=area_slug,
                    crag_name=crag_name,
                    sector_name=sector_name,
                    area_name=area_name,
                    created_by_id=str(image.created_by_id) if image.created_by_id else None,
                    published=True,
                    has_gps=image.id in gps_topo_ids,
                )
            )

    region = Region.return_it()
    region_name = region.name if region is not None else ""
    return region_name, spots, lines, topos


def _marker_flags() -> dict[tuple[str, object], tuple[bool, bool]]:
    flags: dict[tuple[str, object], tuple[bool, bool]] = {}
    markers = MapMarker.query.filter(
        MapMarker.lat.isnot(None),
        MapMarker.lng.isnot(None),
    ).all()
    for marker in markers:
        for level, fk in (("crag", marker.crag_id), ("sector", marker.sector_id), ("area", marker.area_id)):
            if fk is None:
                continue
            has_gps, has_parking = flags.get((level, fk), (False, False))
            if marker.type == _GPS_TYPE[level]:
                has_gps = True
            if marker.type == MapMarkerType.PARKING:
                has_parking = True
            flags[(level, fk)] = (has_gps, has_parking)
    return flags
