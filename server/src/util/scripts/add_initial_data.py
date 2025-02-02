from flask import current_app

from app import app
from extensions import db
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.menu_item import MenuItem
from models.region import Region


def add_initial_data():
    """
    Adds the initial data. If no region exists, the initial data setup is performed.
    """
    with app.app_context():
        if not Region.return_it():
            new_region = Region()
            new_region.name = "Your climbing region"
            db.session.add(new_region)
            print("Added default region.")
            topo_menu_item = MenuItem()
            topo_menu_item.position = MenuItemPositionEnum.TOP
            topo_menu_item.order_index = 0
            topo_menu_item.type = MenuItemTypeEnum.TOPO
            db.session.add(topo_menu_item)
            print("Added topo menu item.")
            db.session.commit()


if __name__ == "__main__":
    add_initial_data()
