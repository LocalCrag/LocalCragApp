"""Point values and rollups for the topo quality tool.

Required checks are the 100% score. Videos and first-ascent info are bonus:
they add points, and they are not part of the max. Gym instances skip GPS,
parking, and the line-description quota. The gym stand-in for a first ascent
is the routesetter plus the set date, which is where that data lives now.
"""

from __future__ import annotations

import json
import math
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime

from models.enums.publication_status_enum import PublicationStatusEnum

# Angle and feature flags from the line form's style group.
STYLE_FIELDS = (
    "roof",
    "overhang",
    "vertical",
    "slab",
    "traverse",
    "dihedral",
    "compression",
    "arete",
    "crack",
    "dyno",
    "mantle",
)

LINE_DRAWN = 2
LINE_STYLE = 5
LINE_DESCRIPTION = 2
TOPO_GPS = 10
SPOT_GPS = 8
SPOT_PARKING = 8
SPOT_DESCRIPTION = 5
SPOT_IMAGE = 10
LINE_VIDEO = 3
LINE_FA = 3
# Moderator score only. Creating a published line, spot, or topo image pays this
# on its own. The property gates above pay extra, and this is not part of the percent.
CREATE_ITEM = 3
EDIT_BONUS = 1
DESCRIPTION_RATIO = 0.2
MAX_CHECK_ITEMS = 300

_TAG_RE = re.compile(r"<[^>]+>")
_TIERS = (
    (40, "weak"),
    (60, "okay"),
    (80, "solid"),
    (95, "good"),
)


def has_text(value) -> bool:
    if not value or not isinstance(value, str):
        return False
    text = _TAG_RE.sub(" ", value).replace("&nbsp;", " ")
    return bool(text.strip())


def has_video(videos) -> bool:
    if isinstance(videos, str):
        try:
            videos = json.loads(videos)
        except json.JSONDecodeError:
            return False
    if not videos:
        return False
    items = videos if isinstance(videos, list) else []
    for item in items:
        if isinstance(item, str) and item.strip():
            return True
        if isinstance(item, dict) and str(item.get("url") or "").strip():
            return True
    return False


def is_published(status) -> bool:
    if status is None:
        return False
    value = status.value if hasattr(status, "value") else status
    return value == PublicationStatusEnum.PUBLISHED.value


def is_styled(values) -> bool:
    """``values`` is an object or a mapping with the style flag names."""
    for field in STYLE_FIELDS:
        if isinstance(values, dict):
            current = values.get(field)
        else:
            current = getattr(values, field, False)
        if current:
            return True
    return False


def fa_complete(values, gym: bool) -> bool:
    def read(name):
        if isinstance(values, dict):
            return values.get(name)
        return getattr(values, name, None)

    if gym:
        return has_text(read("routesetter") or "") and read("set_date") is not None
    return has_text(read("fa_name") or "") and (read("fa_date") is not None or read("fa_year") is not None)


def description_slots(line_count: int, gym: bool) -> int:
    if gym or line_count <= 0:
        return 0
    return math.ceil(line_count * DESCRIPTION_RATIO)


def description_earned_max(line_count: int, described_count: int, gym: bool) -> tuple[int, int]:
    slots = description_slots(line_count, gym)
    if slots <= 0:
        return 0, 0
    return min(described_count, slots) * LINE_DESCRIPTION, slots * LINE_DESCRIPTION


def tier_for(percent: int) -> str:
    for limit, name in _TIERS:
        if percent < limit:
            return name
    return "platin"


def summarize(earned: int, maximum: int, bonus: int) -> dict:
    if maximum <= 0:
        percent = 100
    else:
        percent = int((earned * 100 + maximum // 2) // maximum)
        percent = max(0, min(100, percent))
    return {
        "earned": earned,
        "max": maximum,
        "bonus": bonus,
        "percent": percent,
        "tier": tier_for(percent),
    }


def publish_delta(before_published: bool, after_published: bool) -> int:
    """Base points for a published item appearing.

    Unpublishing or deleting pays nothing back. Taking points away would
    reward leaving a bad entry in place.
    """
    if after_published and not before_published:
        return CREATE_ITEM
    return 0


def gate_delta(before_on: bool, after_on: bool, changed: bool, points: int) -> int:
    """Points to add for one gate. A same-state edit of relevant data pays ``EDIT_BONUS``.

    Turning a gate off pays nothing back.
    """
    if points <= 0:
        return 0
    if after_on and not before_on:
        return points
    if changed and before_on and after_on:
        return EDIT_BONUS
    return 0


@dataclass
class LineRecord:
    id: str
    name: str
    slug: str
    area_id: str
    crag_slug: str
    sector_slug: str
    area_slug: str
    created_by_id: str | None
    time_created: datetime | None
    published: bool
    drawn: bool
    styled: bool
    has_video: bool
    fa_complete: bool
    has_description: bool
    crag_name: str = ""
    sector_name: str = ""
    area_name: str = ""


@dataclass
class TopoRecord:
    id: str
    name: str
    area_id: str
    crag_slug: str
    sector_slug: str
    area_slug: str
    created_by_id: str | None
    published: bool
    has_gps: bool
    crag_name: str = ""
    sector_name: str = ""
    area_name: str = ""


@dataclass
class SpotRecord:
    id: str
    name: str
    slug: str
    level: str
    parent_id: str | None
    crag_slug: str
    sector_slug: str | None
    area_slug: str | None
    order_index: int
    created_by_id: str | None
    published: bool
    has_gps: bool
    has_parking: bool
    has_description: bool
    has_image: bool
    crag_name: str = ""
    sector_name: str = ""
    area_name: str = ""


def score_scope(spots: list[SpotRecord], lines: list[LineRecord], topos: list[TopoRecord], gym: bool) -> dict:
    earned = 0
    maximum = 0
    bonus = 0
    published_spots = [spot for spot in spots if spot.published]
    for spot in published_spots:
        spot_earned, spot_max = _spot_earned_max(spot, gym)
        earned += spot_earned
        maximum += spot_max

    published_lines = [line for line in lines if line.published]
    for line in published_lines:
        if line.drawn:
            earned += LINE_DRAWN
        if line.styled:
            earned += LINE_STYLE
        maximum += LINE_DRAWN + LINE_STYLE
        if line.has_video:
            bonus += LINE_VIDEO
        if line.fa_complete:
            bonus += LINE_FA

    lines_by_area = defaultdict(list)
    for line in published_lines:
        lines_by_area[line.area_id].append(line)
    for spot in published_spots:
        if spot.level != "area":
            continue
        group = lines_by_area.get(spot.id, [])
        described = sum(1 for line in group if line.has_description)
        desc_earned, desc_max = description_earned_max(len(group), described, gym)
        earned += desc_earned
        maximum += desc_max

    if not gym:
        for topo in topos:
            if not topo.published:
                continue
            maximum += TOPO_GPS
            if topo.has_gps:
                earned += TOPO_GPS
    return summarize(earned, maximum, bonus)


def _spot_earned_max(spot: SpotRecord, gym: bool) -> tuple[int, int]:
    earned = 0
    maximum = SPOT_DESCRIPTION + SPOT_IMAGE
    if spot.has_description:
        earned += SPOT_DESCRIPTION
    if spot.has_image:
        earned += SPOT_IMAGE
    if not gym:
        maximum += SPOT_GPS + SPOT_PARKING
        if spot.has_gps:
            earned += SPOT_GPS
        if spot.has_parking:
            earned += SPOT_PARKING
    return earned, maximum


def creator_points(
    spots: list[SpotRecord], lines: list[LineRecord], topos: list[TopoRecord], gym: bool
) -> dict[str, int]:
    """Starting scores: each entity's current points go to its creator."""
    totals = defaultdict(int)
    for spot in spots:
        if not spot.published or not spot.created_by_id:
            continue
        earned, _max = _spot_earned_max(spot, gym)
        totals[spot.created_by_id] += earned + CREATE_ITEM

    published_lines = [line for line in lines if line.published]
    for line in published_lines:
        if not line.created_by_id:
            continue
        totals[line.created_by_id] += CREATE_ITEM
        if line.drawn:
            totals[line.created_by_id] += LINE_DRAWN
        if line.styled:
            totals[line.created_by_id] += LINE_STYLE
        if line.has_video:
            totals[line.created_by_id] += LINE_VIDEO
        if line.fa_complete:
            totals[line.created_by_id] += LINE_FA

    if not gym:
        by_area = defaultdict(list)
        for line in published_lines:
            by_area[line.area_id].append(line)
        area_ids = {spot.id for spot in spots if spot.published and spot.level == "area"}
        for area_id in area_ids:
            group = by_area.get(area_id, [])
            slots = description_slots(len(group), gym)
            described = sorted(
                (line for line in group if line.has_description),
                key=lambda line: (line.time_created or datetime.min, line.id),
            )
            for line in described[:slots]:
                if line.created_by_id:
                    totals[line.created_by_id] += LINE_DESCRIPTION
    for topo in topos:
        if topo.published and topo.created_by_id:
            totals[topo.created_by_id] += CREATE_ITEM
            if not gym and topo.has_gps:
                totals[topo.created_by_id] += TOPO_GPS
    return {user_id: points for user_id, points in totals.items() if points}


def _place_names(record) -> dict:
    return {
        "cragName": record.crag_name or None,
        "sectorName": record.sector_name or None,
        "areaName": record.area_name or None,
    }


def _line_item(line: LineRecord) -> dict:
    return {
        "kind": "line",
        "name": line.name,
        "cragSlug": line.crag_slug,
        "sectorSlug": line.sector_slug,
        "areaSlug": line.area_slug,
        "lineSlug": line.slug,
        **_place_names(line),
    }


def _topo_item(topo: TopoRecord) -> dict:
    return {
        "kind": "topoImage",
        "name": topo.name,
        "cragSlug": topo.crag_slug,
        "sectorSlug": topo.sector_slug,
        "areaSlug": topo.area_slug,
        "lineSlug": None,
        **_place_names(topo),
    }


def _spot_item(spot: SpotRecord) -> dict:
    return {
        "kind": spot.level,
        "name": spot.name,
        "cragSlug": spot.crag_slug,
        "sectorSlug": spot.sector_slug,
        "areaSlug": spot.area_slug,
        "lineSlug": None,
        **_place_names(spot),
    }


def _check(key: str, earned: int, maximum: int, bonus: bool, items: list[dict]) -> dict:
    shown = items[:MAX_CHECK_ITEMS]
    return {
        "key": key,
        "earned": earned,
        "max": maximum,
        "bonus": bonus,
        "items": shown,
        "remaining": max(0, len(items) - len(shown)),
    }


def build_checks(spots: list[SpotRecord], lines: list[LineRecord], topos: list[TopoRecord], gym: bool) -> list[dict]:
    published_lines = sorted((line for line in lines if line.published), key=lambda line: line.name.lower())
    published_topos = sorted((topo for topo in topos if topo.published), key=lambda topo: topo.name.lower())
    published_spots = [spot for spot in spots if spot.published]
    checks = []

    if published_lines:
        drawn = [line for line in published_lines if line.drawn]
        styled = [line for line in published_lines if line.styled]
        checks.append(
            _check(
                "lineDrawn",
                len(drawn) * LINE_DRAWN,
                len(published_lines) * LINE_DRAWN,
                False,
                [_line_item(line) for line in published_lines if not line.drawn],
            )
        )
        checks.append(
            _check(
                "lineStyle",
                len(styled) * LINE_STYLE,
                len(published_lines) * LINE_STYLE,
                False,
                [_line_item(line) for line in published_lines if not line.styled],
            )
        )

    image_spots = [spot for spot in published_spots if spot.level in ("crag", "sector", "area")]
    if image_spots:
        with_image = [spot for spot in image_spots if spot.has_image]
        checks.append(
            _check(
                "spotImage",
                len(with_image) * SPOT_IMAGE,
                len(image_spots) * SPOT_IMAGE,
                False,
                [_spot_item(spot) for spot in image_spots if not spot.has_image],
            )
        )

    if not gym and published_topos:
        with_gps = [topo for topo in published_topos if topo.has_gps]
        checks.append(
            _check(
                "topoGps",
                len(with_gps) * TOPO_GPS,
                len(published_topos) * TOPO_GPS,
                False,
                [_topo_item(topo) for topo in published_topos if not topo.has_gps],
            )
        )

    if not gym and image_spots:
        with_gps = [spot for spot in image_spots if spot.has_gps]
        with_parking = [spot for spot in image_spots if spot.has_parking]
        checks.append(
            _check(
                "spotGps",
                len(with_gps) * SPOT_GPS,
                len(image_spots) * SPOT_GPS,
                False,
                [_spot_item(spot) for spot in image_spots if not spot.has_gps],
            )
        )
        checks.append(
            _check(
                "spotParking",
                len(with_parking) * SPOT_PARKING,
                len(image_spots) * SPOT_PARKING,
                False,
                [_spot_item(spot) for spot in image_spots if not spot.has_parking],
            )
        )

    if image_spots:
        with_description = [spot for spot in image_spots if spot.has_description]
        checks.append(
            _check(
                "spotDescription",
                len(with_description) * SPOT_DESCRIPTION,
                len(image_spots) * SPOT_DESCRIPTION,
                False,
                [_spot_item(spot) for spot in image_spots if not spot.has_description],
            )
        )

    if published_lines and not gym:
        lines_by_area = defaultdict(list)
        for line in published_lines:
            lines_by_area[line.area_id].append(line)
        area_ids = [spot.id for spot in published_spots if spot.level == "area"]
        earned = 0
        maximum = 0
        missing = []
        for area_id in area_ids:
            group = lines_by_area.get(area_id, [])
            described = sum(1 for line in group if line.has_description)
            desc_earned, desc_max = description_earned_max(len(group), described, gym)
            earned += desc_earned
            maximum += desc_max
            if described < description_slots(len(group), gym):
                missing.extend(_line_item(line) for line in group if not line.has_description)
        if maximum:
            checks.append(_check("lineDescriptions", earned, maximum, False, missing))

    if published_lines:
        with_video = [line for line in published_lines if line.has_video]
        with_fa = [line for line in published_lines if line.fa_complete]
        checks.append(
            _check(
                "lineVideo",
                len(with_video) * LINE_VIDEO,
                len(published_lines) * LINE_VIDEO,
                True,
                [_line_item(line) for line in published_lines if not line.has_video],
            )
        )
        checks.append(
            _check(
                "lineFa",
                len(with_fa) * LINE_FA,
                len(published_lines) * LINE_FA,
                True,
                [_line_item(line) for line in published_lines if not line.fa_complete],
            )
        )
    return checks


def _node(name: str, slug: str | None, summary: dict, **extra) -> dict:
    payload = {"name": name, "slug": slug, **summary}
    payload.update(extra)
    return payload


def build_tree(
    region_name: str,
    spots: list[SpotRecord],
    lines: list[LineRecord],
    topos: list[TopoRecord],
    gym: bool,
) -> dict:
    crags = sorted((spot for spot in spots if spot.level == "crag"), key=lambda spot: (spot.order_index, spot.name))
    sectors = [spot for spot in spots if spot.level == "sector"]
    areas = [spot for spot in spots if spot.level == "area"]
    lines_by_area = defaultdict(list)
    topos_by_area = defaultdict(list)
    for line in lines:
        lines_by_area[line.area_id].append(line)
    for topo in topos:
        topos_by_area[topo.area_id].append(topo)

    def gathered(area_ids):
        grouped_lines = []
        grouped_topos = []
        for area_id in area_ids:
            grouped_lines.extend(lines_by_area.get(area_id, ()))
            grouped_topos.extend(topos_by_area.get(area_id, ()))
        return grouped_lines, grouped_topos

    crag_nodes = []
    for crag in crags:
        crag_sectors = sorted(
            (spot for spot in sectors if spot.parent_id == crag.id),
            key=lambda spot: (spot.order_index, spot.name),
        )
        sector_nodes = []
        for sector in crag_sectors:
            sector_areas = sorted(
                (spot for spot in areas if spot.parent_id == sector.id),
                key=lambda spot: (spot.order_index, spot.name),
            )
            area_nodes = []
            for area in sector_areas:
                area_lines = lines_by_area.get(area.id, [])
                area_topos = topos_by_area.get(area.id, [])
                area_nodes.append(
                    _node(
                        area.name,
                        area.slug,
                        score_scope([area], area_lines, area_topos, gym),
                        cragSlug=crag.slug,
                        sectorSlug=sector.slug,
                    )
                )
            sector_lines, sector_topos = gathered(area.id for area in sector_areas)
            sector_nodes.append(
                _node(
                    sector.name,
                    sector.slug,
                    score_scope([sector, *sector_areas], sector_lines, sector_topos, gym),
                    cragSlug=crag.slug,
                    areas=area_nodes,
                )
            )
        sector_ids = {sector.id for sector in crag_sectors}
        crag_areas = [area for area in areas if area.parent_id in sector_ids]
        crag_lines, crag_topos = gathered(area.id for area in crag_areas)
        crag_spots = [crag, *crag_sectors, *crag_areas]
        crag_nodes.append(
            _node(
                crag.name,
                crag.slug,
                score_scope(crag_spots, crag_lines, crag_topos, gym),
                sectors=sector_nodes,
            )
        )
    return {
        "gymMode": gym,
        "region": _node(region_name, None, score_scope(spots, lines, topos, gym), crags=crag_nodes),
    }


def scope_for(
    level: str,
    target_id: str,
    spots: list[SpotRecord],
    lines: list[LineRecord],
    topos: list[TopoRecord],
) -> tuple[list[SpotRecord], list[LineRecord], list[TopoRecord], SpotRecord | None]:
    target = next((spot for spot in spots if spot.id == target_id and spot.level == level), None)
    if level == "region":
        return spots, lines, topos, None
    if target is None:
        return [], [], [], None
    if level == "area":
        return (
            [target],
            [line for line in lines if line.area_id == target.id],
            [topo for topo in topos if topo.area_id == target.id],
            target,
        )
    if level == "sector":
        areas = [spot for spot in spots if spot.level == "area" and spot.parent_id == target.id]
        area_ids = {area.id for area in areas}
        return (
            [target, *areas],
            [line for line in lines if line.area_id in area_ids],
            [topo for topo in topos if topo.area_id in area_ids],
            target,
        )
    sectors = [spot for spot in spots if spot.level == "sector" and spot.parent_id == target.id]
    sector_ids = {sector.id for sector in sectors}
    areas = [spot for spot in spots if spot.level == "area" and spot.parent_id in sector_ids]
    area_ids = {area.id for area in areas}
    return (
        [target, *sectors, *areas],
        [line for line in lines if line.area_id in area_ids],
        [topo for topo in topos if topo.area_id in area_ids],
        target,
    )


def build_detail(
    level: str,
    target_id: str,
    region_name: str,
    spots: list[SpotRecord],
    lines: list[LineRecord],
    topos: list[TopoRecord],
    gym: bool,
) -> dict | None:
    scoped_spots, scoped_lines, scoped_topos, target = scope_for(level, target_id, spots, lines, topos)
    if level != "region" and target is None:
        return None
    summary = score_scope(scoped_spots, scoped_lines, scoped_topos, gym)
    payload = {
        "level": level,
        "name": region_name if level == "region" else target.name,
        "gymMode": gym,
        "cragSlug": None if target is None else target.crag_slug,
        "sectorSlug": None if target is None else target.sector_slug,
        "areaSlug": None if target is None else target.area_slug,
        "checks": build_checks(scoped_spots, scoped_lines, scoped_topos, gym),
        **summary,
    }
    return payload
