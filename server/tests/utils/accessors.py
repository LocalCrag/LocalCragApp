def get_item_by_id(items, id):
    """
    Returns the first item in the collection that has the given id.
    :param items: Items to search.
    :param id: Id to check for.
    :return: Item with given id.
    """
    for item in items:
        if item['id'] == id:
            return item
    return None
