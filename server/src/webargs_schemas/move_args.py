from webargs import fields

move_line_args = {
    "areaId": fields.Str(required=True),
}

move_area_args = {
    "sectorId": fields.Str(required=True),
}

move_sector_args = {
    "cragId": fields.Str(required=True),
}

move_topo_image_args = {
    "areaId": fields.Str(required=True),
}
