from app import app
from extensions import db
from models.enums.menu_item_position_enum import MenuItemPositionEnum
from models.enums.menu_item_type_enum import MenuItemTypeEnum
from models.menu_item import MenuItem
from models.menu_page import MenuPage
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

            news_menu_item = MenuItem()
            news_menu_item.position = MenuItemPositionEnum.TOP
            news_menu_item.order_index = 0
            news_menu_item.type = MenuItemTypeEnum.NEWS
            db.session.add(news_menu_item)

            topo_menu_item = MenuItem()
            topo_menu_item.position = MenuItemPositionEnum.TOP
            topo_menu_item.order_index = 1
            topo_menu_item.type = MenuItemTypeEnum.TOPO
            db.session.add(topo_menu_item)

            ascents_menu_item = MenuItem()
            ascents_menu_item.position = MenuItemPositionEnum.TOP
            ascents_menu_item.order_index = 2
            ascents_menu_item.type = MenuItemTypeEnum.ASCENTS
            db.session.add(ascents_menu_item)

            ranking_menu_item = MenuItem()
            ranking_menu_item.position = MenuItemPositionEnum.TOP
            ranking_menu_item.order_index = 3
            ranking_menu_item.type = MenuItemTypeEnum.RANKING
            db.session.add(ranking_menu_item)

            gallery_menu_item = MenuItem()
            gallery_menu_item.position = MenuItemPositionEnum.TOP
            gallery_menu_item.order_index = 4
            gallery_menu_item.type = MenuItemTypeEnum.GALLERY
            db.session.add(gallery_menu_item)

            imprint_page = MenuPage()
            imprint_page.title = "Imprint"
            imprint_page.text = "This is the imprint page. Please edit it in the menu pages section."
            db.session.add(imprint_page)

            contact_page = MenuPage()
            contact_page.title = "Contact"
            contact_page.text = "This is the contact page. Please edit it in the menu pages section."
            db.session.add(contact_page)

            contact_menu_item = MenuItem()
            contact_menu_item.position = MenuItemPositionEnum.BOTTOM
            contact_menu_item.order_index = 0
            contact_menu_item.type = MenuItemTypeEnum.MENU_PAGE
            contact_menu_item.menu_page = contact_page
            db.session.add(contact_menu_item)

            imprint_menu_item = MenuItem()
            imprint_menu_item.position = MenuItemPositionEnum.BOTTOM
            imprint_menu_item.order_index = 1
            imprint_menu_item.type = MenuItemTypeEnum.MENU_PAGE
            imprint_menu_item.menu_page = imprint_page
            db.session.add(imprint_menu_item)

            db.session.commit()


if __name__ == "__main__":
    add_initial_data()
