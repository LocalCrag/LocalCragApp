_LINE_COUNT_CACHE = "_line_count_cache"
_ASCENT_COUNT_CACHE = "_ascent_count_cache"
_LINE_ASCENT_COUNT_CACHE = "_line_ascent_count_cache"


def get_cached_line_count(entity) -> int | None:
    return getattr(entity, _LINE_COUNT_CACHE, None)


def get_cached_ascent_count(entity) -> int | None:
    return getattr(entity, _ASCENT_COUNT_CACHE, None)


def get_cached_line_ascent_count(line) -> int | None:
    return getattr(line, _LINE_ASCENT_COUNT_CACHE, None)
