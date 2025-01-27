import pytest
from flask import current_app

from extensions import db
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.instance_settings import InstanceSettings
from models.menu_item import MenuItem
from models.region import Region
from models.user import User
from util.scripts.database_setup import setup_database


def test_database_setup(client, clean_db, mocker):
    mock_SMTP_SSL = mocker.MagicMock(name="util.email.smtplib.SMTP_SSL")
    mocker.patch("util.email.smtplib.SMTP_SSL", new=mock_SMTP_SSL)

    setup_database()

    # Superadmin invite mail was sent
    assert mock_SMTP_SSL.return_value.__enter__.return_value.login.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.sendmail.call_count == 1
    assert mock_SMTP_SSL.return_value.__enter__.return_value.quit.call_count == 1

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
    assert region.name == "Your climbing region 2"

    menu_items = db.session.query(MenuItem).all()
    assert len(menu_items) == 1
    menu_item = menu_items[0]
    assert menu_item.position == MenuItemPositionEnum.TOP
    assert menu_item.order_index == 0
    assert menu_item.type == MenuItemTypeEnum.TOPO

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
        setup_database()
