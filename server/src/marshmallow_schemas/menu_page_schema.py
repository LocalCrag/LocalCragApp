from marshmallow import fields, post_dump

from marshmallow_schemas.base_entity_schema import BaseEntityMinSchema
from util.bucket_placeholders import replace_bucket_placeholders


class MenuPageMinSchema(BaseEntityMinSchema):
    title = fields.String()
    slug = fields.String()


class MenuPageSchema(MenuPageMinSchema):
    text = fields.String()

    @post_dump
    def handle_bucket_placeholders(self, data, **kwargs):
        data["text"] = replace_bucket_placeholders(data["text"])
        return data


menu_page_schema = MenuPageSchema()
menu_page_min_schema = MenuPageMinSchema()
menu_pages_schema = MenuPageSchema(many=True)
