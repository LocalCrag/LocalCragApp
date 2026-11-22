from marshmallow import fields

from util.condicaster import cached_scores, effective_condicaster_crag_id


class CondicasterSchemaMixin:
    """Resolved conditions for list and detail payloads.

    `condiscore` follows the ancestor chain and comes from the cache, so list
    pages do not call CondiCaster.
    """

    hasCondicaster = fields.Method("get_has_condicaster")
    condiscore = fields.Method("get_condiscore")

    def get_has_condicaster(self, obj) -> bool:
        return effective_condicaster_crag_id(obj) is not None

    def get_condiscore(self, obj):
        crag_id = effective_condicaster_crag_id(obj)
        if crag_id is None:
            return None
        return cached_scores().get(crag_id)
