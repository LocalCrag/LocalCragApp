from PIL import Image

from uploader.errors import InvalidImageTransform
from uploader.image_transform import apply_rotation_and_crop, is_identity_transform


def _marked_image() -> Image.Image:
    img = Image.new("RGB", (2, 1))
    img.putpixel((0, 0), (255, 0, 0))
    img.putpixel((1, 0), (0, 255, 0))
    img.format = "PNG"
    return img


def test_clockwise_rotation_moves_pixels():
    rotated = apply_rotation_and_crop(_marked_image(), 90, None)
    assert rotated.size == (1, 2)
    # Left pixel moves to the top; right pixel moves to the bottom.
    assert rotated.getpixel((0, 0)) == (255, 0, 0)
    assert rotated.getpixel((0, 1)) == (0, 255, 0)
    assert rotated.format == "PNG"


def test_crop_uses_rotated_coordinates():
    # Right pixel of the original is the bottom pixel after a clockwise quarter turn.
    cropped = apply_rotation_and_crop(_marked_image(), 90, {"x": 0, "y": 1, "width": 1, "height": 1})
    assert cropped.size == (1, 1)
    assert cropped.getpixel((0, 0)) == (0, 255, 0)


def test_identity_transform_detects_full_frame():
    assert is_identity_transform(20, 10, 0, None)
    assert is_identity_transform(20, 10, 0, {"x": 0, "y": 0, "width": 20, "height": 10})
    assert not is_identity_transform(20, 10, 90, None)


def test_crop_outside_the_image_is_rejected():
    try:
        apply_rotation_and_crop(_marked_image(), 0, {"x": 5, "y": 0, "width": 1, "height": 1})
    except InvalidImageTransform:
        return
    raise AssertionError("expected InvalidImageTransform")
