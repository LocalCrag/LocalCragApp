"""Load published topo rows for the quality report."""

from __future__ import annotations

from sqlalchemy import or_
from sqlalchemy.orm import load_only, noload

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
    STYLE_FIELDS,
    LineRecord,
    SpotRecord,
    TopoRecord,
    fa_complete,
    has_text,
    has_video,
    is_project_grade,
    is_styled,
)

_GPS_TYPE = {
    "crag": MapMarkerType.CRAG,
    "sector": MapMarkerType.SECTOR,
    "area": MapMarkerType.AREA,
}
_LINE_COLUMNS = (
    Line.id,
    Line.name,
    Line.slug,
    Line.area_id,
    Line.created_by_id,
    Line.time_created,
    Line.description,
    Line.videos,
    Line.publication_status,
    Line.author_grade_value,
    Line.fa_name,
    Line.fa_date,
    Line.fa_year,
    Line.routesetter,
    Line.set_date,
    *(getattr(Line, field) for field in STYLE_FIELDS),
)


def load_quality_snapshot(
    exclude_secret: bool, gym: bool, root: tuple[str, str] | None = None
) -> tuple[str, list[SpotRecord], list[LineRecord], list[TopoRecord]]:
    """Published spots, lines, and topo images for one report.

    ``root`` is ``("crag"|"sector"|"area", id)`` for a detail page. The tree
    and the region detail pass nothing and load the whole visible catalog.
    A detail page loads only that spot and the spots underneath it.
    """
    secret_ids = set()
    if exclude_secret:
        secret_ids = {row[0] for row in db.session.query(SecretTopoEntity.entity_id).all()}

    crags, sectors, areas = _load_spots(root)
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
    waived_parking = _parking_waived_ids()

    marker_flags = _marker_flags(visible_crag_ids, visible_sector_ids, visible_area_ids)
    spots = []
    for crag in visible_crags:
        gps, parking = marker_flags.get(("crag", str(crag.id)), (False, False))
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
                parking_required=True,
            )
        )
    for sector in visible_sectors:
        crag = crag_by_id[sector.crag_id]
        gps, parking = marker_flags.get(("sector", str(sector.id)), (False, False))
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
                parking_required=str(sector.id) not in waived_parking,
            )
        )
    for area in visible_areas:
        sector = sector_by_id[area.sector_id]
        crag = crag_by_id[sector.crag_id]
        gps, parking = marker_flags.get(("area", str(area.id)), (False, False))
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
                parking_required=str(area.id) not in waived_parking,
            )
        )

    drawn_line_ids = _drawn_line_ids(visible_area_ids)
    gps_topo_ids = _gps_topo_ids(visible_area_ids)

    area_path = {}
    for area in visible_areas:
        sector = sector_by_id[area.sector_id]
        crag = crag_by_id[sector.crag_id]
        area_path[area.id] = (crag.slug, sector.slug, area.slug, crag.name, sector.name, area.name)

    lines = []
    if visible_area_ids:
        line_query = Line.query.options(load_only(*_LINE_COLUMNS)).filter(
            Line.publication_status == PublicationStatusEnum.PUBLISHED,
            Line.area_id.in_(visible_area_ids),
        )
        for line in line_query:
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
                    drawn=str(line.id) in drawn_line_ids,
                    styled=is_styled(line),
                    has_video=has_video(line.videos),
                    fa_complete=fa_complete(line, gym),
                    has_description=has_text(line.description),
                    is_project=is_project_grade(line.author_grade_value),
                )
            )

    topos = []
    if visible_area_ids:
        topo_query = TopoImage.query.options(
            load_only(
                TopoImage.id,
                TopoImage.area_id,
                TopoImage.file_id,
                TopoImage.title,
                TopoImage.created_by_id,
                TopoImage.publication_status,
            )
        ).filter(
            TopoImage.publication_status == PublicationStatusEnum.PUBLISHED,
            TopoImage.area_id.in_(visible_area_ids),
        )
        for image in topo_query:
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
                    has_gps=str(image.id) in gps_topo_ids,
                )
            )

    region = Region.return_it()
    region_name = region.name if region is not None else ""
    return region_name, spots, lines, topos


def _load_spots(root: tuple[str, str] | None) -> tuple[list, list, list]:
    """Published crags, sectors, and areas for the whole region or one detail page."""
    if root is None:
        return _published(Crag), _published(Sector), _published(Area)
    level, target_id = root
    if level == "crag":
        crags = _published(Crag, Crag.id == target_id)
        sectors = _published(Sector, Sector.crag_id == target_id)
        areas = _published(Area, Area.sector_id.in_([sector.id for sector in sectors])) if sectors else []
        return crags, sectors, areas
    if level == "sector":
        sectors = _published(Sector, Sector.id == target_id)
        crags = _published(Crag, Crag.id.in_([sector.crag_id for sector in sectors])) if sectors else []
        areas = _published(Area, Area.sector_id == target_id)
        return crags, sectors, areas
    areas = _published(Area, Area.id == target_id)
    sectors = _published(Sector, Sector.id.in_([area.sector_id for area in areas])) if areas else []
    crags = _published(Crag, Crag.id.in_([sector.crag_id for sector in sectors])) if sectors else []
    return crags, sectors, areas


def _published(model, *criteria):
    """Published rows of one spot model, with only the columns the score reads."""
    columns = [
        model.id,
        model.name,
        model.slug,
        model.order_index,
        model.created_by_id,
        model.description,
        model.short_description,
        model.portrait_image_id,
        model.publication_status,
    ]
    if model is Sector:
        columns.append(Sector.crag_id)
    elif model is Area:
        columns.append(Area.sector_id)
    query = model.query.options(load_only(*columns), noload(model.portrait_image)).filter(
        model.publication_status == PublicationStatusEnum.PUBLISHED
    )
    for criterion in criteria:
        query = query.filter(criterion)
    return query.order_by(model.order_index.asc(), model.name.asc()).all()


def _drawn_line_ids(area_ids) -> set:
    if not area_ids:
        return set()
    rows = (
        db.session.query(LinePath.line_id)
        .join(Line, Line.id == LinePath.line_id)
        .filter(Line.area_id.in_(area_ids))
        .distinct()
        .all()
    )
    return {str(row[0]) for row in rows}


def _gps_topo_ids(area_ids) -> set:
    if not area_ids:
        return set()
    rows = (
        db.session.query(MapMarker.topo_image_id)
        .join(TopoImage, TopoImage.id == MapMarker.topo_image_id)
        .filter(
            TopoImage.area_id.in_(area_ids),
            MapMarker.lat.isnot(None),
            MapMarker.lng.isnot(None),
        )
        .distinct()
        .all()
    )
    return {str(row[0]) for row in rows}


def _parking_waived_ids() -> set[str]:
    """Spot ids whose parking is covered by a parent, including a secret parent.

    The quality page can hide secret spots. A hidden parent's parking still
    covers the spots under it.
    """
    parking_rows = (
        db.session.query(MapMarker.crag_id, MapMarker.sector_id, MapMarker.area_id)
        .filter(
            MapMarker.type == MapMarkerType.PARKING,
            MapMarker.lat.isnot(None),
            MapMarker.lng.isnot(None),
        )
        .all()
    )
    parking_crags = {str(crag_id) for crag_id, _sector_id, _area_id in parking_rows if crag_id is not None}
    parking_sectors = {str(sector_id) for _crag_id, sector_id, _area_id in parking_rows if sector_id is not None}
    sector_parent = {str(sector_id): str(crag_id) for sector_id, crag_id in db.session.query(Sector.id, Sector.crag_id)}
    waived = {sector_id for sector_id, crag_id in sector_parent.items() if crag_id in parking_crags}
    for area_id, sector_id in db.session.query(Area.id, Area.sector_id):
        sector_key = str(sector_id)
        if sector_key in parking_sectors or sector_parent.get(sector_key) in parking_crags:
            waived.add(str(area_id))
    return waived


def _marker_flags(crag_ids, sector_ids, area_ids) -> dict[tuple[str, object], tuple[bool, bool]]:
    flags: dict[tuple[str, object], tuple[bool, bool]] = {}
    clauses = []
    if crag_ids:
        clauses.append(MapMarker.crag_id.in_(crag_ids))
    if sector_ids:
        clauses.append(MapMarker.sector_id.in_(sector_ids))
    if area_ids:
        clauses.append(MapMarker.area_id.in_(area_ids))
    if not clauses:
        return flags
    rows = (
        db.session.query(MapMarker.crag_id, MapMarker.sector_id, MapMarker.area_id, MapMarker.type)
        .filter(MapMarker.lat.isnot(None), MapMarker.lng.isnot(None), or_(*clauses))
        .all()
    )
    for crag_id, sector_id, area_id, marker_type in rows:
        for level, fk in (("crag", crag_id), ("sector", sector_id), ("area", area_id)):
            if fk is None:
                continue
            has_gps, has_parking = flags.get((level, str(fk)), (False, False))
            if marker_type == _GPS_TYPE[level]:
                has_gps = True
            if marker_type == MapMarkerType.PARKING:
                has_parking = True
            flags[(level, str(fk))] = (has_gps, has_parking)
    return flags
