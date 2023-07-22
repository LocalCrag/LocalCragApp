import re

from error_handling.http_exceptions.not_found import NotFound


def name_to_slug(name: str) -> str:
    """
    Converts a string to a lug like string that can be used in URLs.
    """
    name = name.lower()
    name = re.sub('[ä]', 'ae', name)
    name = re.sub('[ö]', 'oe', name)
    name = re.sub('[ü]', 'ue', name)
    name = re.sub('[^a-z0-9]', '-', name)
    return name.strip('-')


def get_free_slug(slug: str, testing_function, iteration=0) -> str:
    """
    Checks, if the slug already exists. If yes, a
    """
    iteration_string = ''
    if iteration > 0:
        iteration_string = '-' + str(iteration)
    try:
        if testing_function(slug + iteration_string):
            return get_free_slug(slug, testing_function, iteration + 1)
    except NotFound:
        return slug + iteration_string
