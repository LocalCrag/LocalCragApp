import re


def name_to_slug(name: str) -> str:
    """
    Converts a string to a lug like string that can be used in URLs.
    """
    return re.sub('[^a-z0-9]', '-', name.lower()).strip('-')
