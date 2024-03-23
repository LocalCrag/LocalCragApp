from webargs import fields

menu_page_args = {
    "title": fields.Str(required=True),
    "text": fields.Str(required=True),
}
