import pytest
from flask import current_app

from extensions import db
from migrations.util_scripts.database_setup import database_setup
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.instance_settings import InstanceSettings
from models.menu_item import MenuItem
from models.menu_page import MenuPage
from models.region import Region
from models.user import User


def test_database_setup(client, clean_db, smtp_mock):
    database_setup()
    assert smtp_mock.return_value.__enter__.return_value.login.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.sendmail.call_count == 1
    assert smtp_mock.return_value.__enter__.return_value.quit.call_count == 1

    superadmins = db.session.query(User).filter_by(superadmin=True).all()
    assert len(superadmins) == 1
    superadmin = superadmins[0]
    assert superadmin.firstname == current_app.config["SUPERADMIN_FIRSTNAME"]
    assert superadmin.lastname == current_app.config["SUPERADMIN_LASTNAME"]
    assert superadmin.email == current_app.config["SUPERADMIN_EMAIL"]
    assert superadmin.slug and isinstance(superadmin.slug, str) and superadmin.slug.strip()

    regions = db.session.query(Region).all()
    assert len(regions) == 1
    region = regions[0]
    assert region.name == "Your climbing region"

    menu_items = db.session.query(MenuItem).all()
    assert len(menu_items) == 7
    menu_item = menu_items[0]
    assert menu_item.position == MenuItemPositionEnum.TOP
    assert menu_item.order_index == 0
    assert menu_item.type == MenuItemTypeEnum.NEWS
    menu_item = menu_items[1]
    assert menu_item.position == MenuItemPositionEnum.TOP
    assert menu_item.order_index == 1
    assert menu_item.type == MenuItemTypeEnum.TOPO
    menu_item = menu_items[2]
    assert menu_item.position == MenuItemPositionEnum.TOP
    assert menu_item.order_index == 2
    assert menu_item.type == MenuItemTypeEnum.ASCENTS
    menu_item = menu_items[3]
    assert menu_item.position == MenuItemPositionEnum.TOP
    assert menu_item.order_index == 3
    assert menu_item.type == MenuItemTypeEnum.RANKING
    menu_item = menu_items[4]
    assert menu_item.position == MenuItemPositionEnum.TOP
    assert menu_item.order_index == 4
    assert menu_item.type == MenuItemTypeEnum.GALLERY
    menu_item = menu_items[5]
    assert menu_item.type == MenuItemTypeEnum.MENU_PAGE
    assert menu_item.order_index == 0
    assert menu_item.position == MenuItemPositionEnum.BOTTOM
    menu_item = menu_items[6]
    assert menu_item.type == MenuItemTypeEnum.MENU_PAGE
    assert menu_item.order_index == 1
    assert menu_item.position == MenuItemPositionEnum.BOTTOM

    menu_pages = db.session.query(MenuPage).all()
    assert len(menu_pages) == 2

    instance_settings_s = db.session.query(InstanceSettings).all()
    assert len(instance_settings_s) == 1
    instance_settings = instance_settings_s[0]
    assert instance_settings.instance_name == "My LocalCrag"
    assert instance_settings.copyright_owner == "Your name goes here"


def test_database_setup_with_missing_env_vars(client, clean_db):
    current_app.config["SUPERADMIN_FIRSTNAME"] = None
    current_app.config["SUPERADMIN_LASTNAME"] = None
    current_app.config["SUPERADMIN_EMAIL"] = None
    with pytest.raises(ValueError):
        database_setup()
