"""Pixel rotation and crop for an already stored image.

Rotation is clockwise in 90 degree steps. Crop coordinates are pixels in the
rotated image, origin at the top left. A full-frame crop is treated as no crop.
"""

from PIL import Image

from uploader.errors import InvalidImageTransform

CLOCKWISE_TRANSPOSE = {
    90: Image.Transpose.ROTATE_270,
    180: Image.Transpose.ROTATE_180,
    270: Image.Transpose.ROTATE_90,
}


def rotated_size(width: int, height: int, rotation: int) -> tuple[int, int]:
    if rotation in (90, 270):
        return height, width
    return width, height


def normalize_crop(width: int, height: int, rotation: int, crop: dict | None) -> tuple[int, int, int, int] | None:
    """Return the crop box in rotated pixels, or None when the crop covers the whole frame."""
    if rotation not in (0, 90, 180, 270):
        raise InvalidImageTransform()

    rotated_width, rotated_height = rotated_size(width, height, rotation)
    if not crop:
        return None

    x = int(crop["x"])
    y = int(crop["y"])
    crop_width = int(crop["width"])
    crop_height = int(crop["height"])
    if x < 0 or y < 0 or crop_width < 1 or crop_height < 1 or x >= rotated_width or y >= rotated_height:
        raise InvalidImageTransform()
    if x + crop_width > rotated_width:
        crop_width = rotated_width - x
    if y + crop_height > rotated_height:
        crop_height = rotated_height - y
    if x == 0 and y == 0 and crop_width == rotated_width and crop_height == rotated_height:
        return None
    return x, y, crop_width, crop_height


def is_identity_transform(width: int, height: int, rotation: int, crop: dict | None) -> bool:
    return rotation == 0 and normalize_crop(width, height, rotation, crop) is None


def apply_rotation_and_crop(img: Image.Image, rotation: int, crop: dict | None) -> Image.Image:
    """Rotate clockwise, then crop. `img.format` is kept for the encoder."""
    if not img.width or not img.height:
        raise InvalidImageTransform()

    crop_box = normalize_crop(img.width, img.height, rotation, crop)
    original_format = img.format
    if rotation:
        img = img.transpose(CLOCKWISE_TRANSPOSE[rotation])
    if crop_box:
        x, y, crop_width, crop_height = crop_box
        img = img.crop((x, y, x + crop_width, y + crop_height))
    img.format = original_format
    return img
