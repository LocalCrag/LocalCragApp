"""Extract GPS coordinates from Pillow image EXIF data."""

from __future__ import annotations

from typing import Optional, Tuple

from PIL.ExifTags import IFD


def _dms_to_decimal(dms, ref: str) -> Optional[float]:
    try:
        degrees = float(dms[0]) + float(dms[1]) / 60.0 + float(dms[2]) / 3600.0
    except (TypeError, ValueError, IndexError, ZeroDivisionError):
        return None
    if ref in ("S", "W"):
        degrees = -degrees
    return degrees


def extract_gps_from_image(img) -> Tuple[Optional[float], Optional[float]]:
    """
    Reads lat/lng from image EXIF GPS IFD.

    Must be called before the image is re-encoded without EXIF (e.g. before
    ImageOps.exif_transpose + save), otherwise GPS metadata is lost.
    """
    try:
        exif = img.getexif()
        if not exif:
            return None, None
        gps = exif.get_ifd(IFD.GPS)
        if not gps:
            return None, None
        lat_ref = gps.get(1)
        lat_dms = gps.get(2)
        lng_ref = gps.get(3)
        lng_dms = gps.get(4)
        if not lat_ref or not lat_dms or not lng_ref or not lng_dms:
            return None, None
        lat = _dms_to_decimal(lat_dms, str(lat_ref))
        lng = _dms_to_decimal(lng_dms, str(lng_ref))
        if lat is None or lng is None:
            return None, None
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            return None, None
        return lat, lng
    except Exception:
        return None, None
