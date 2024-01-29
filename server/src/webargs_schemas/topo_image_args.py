from webargs import fields

topo_image_args = {
    "image": fields.String(required=True, allow_none=True)
}
