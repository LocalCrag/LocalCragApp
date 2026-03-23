from webargs import fields

move_line_args = {
    "areaSlug": fields.Str(required=True),
}

move_area_args = {
    "sectorSlug": fields.Str(required=True),
}

move_sector_args = {
    "cragSlug": fields.Str(required=True),
}

move_topo_image_args = {
    "areaSlug": fields.Str(required=True),
}
