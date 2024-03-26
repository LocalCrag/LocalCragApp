from flask import Blueprint

from resources.area_resources import GetAreas, CreateArea, DeleteArea, UpdateArea, GetArea, UpdateAreaOrder, \
    GetAreaGrades
from resources.auth_resources import UserLogin, UserLogoutRefresh, UserLogoutAccess, TokenRefresh, \
    ForgotPassword, ResetPassword
from resources.crag_resources import GetCrags, GetCrag, UpdateCrag, DeleteCrag, CreateCrag, UpdateCragOrder, \
    GetCragGrades
from resources.health_resources import Health
from resources.instance_settings_resources import GetInstanceSettings, UpdateInstanceSettings
from resources.line_path_resources import CreateLinePath, DeleteLinePath, UpdateLinePathOrder, \
    UpdateLinePathOrderForLine
from resources.line_resources import GetLine, UpdateLine, DeleteLine, GetLines, CreateLine
from resources.menu_item_resources import GetMenuItems, CreateMenuItem, GetMenuItem, DeleteMenuItem, UpdateMenuItem, \
    UpdateMenuItemTopOrder, UpdateMenuItemBottomOrder
from resources.menu_page_resources import GetMenuPages, CreateMenuPage, GetMenuPage, DeleteMenuPage, UpdateMenuPage
from resources.post_resources import GetPosts, GetPost, DeletePost, UpdatePost, CreatePost
from resources.region_resources import GetRegion, UpdateRegion, GetRegionGrades
from resources.sector_resources import GetSectors, GetSector, UpdateSector, DeleteSector, CreateSector, \
    UpdateSectorOrder, GetSectorGrades
from resources.topo_image_resources import DeleteTopoImage, AddTopoImage, GetTopoImages, \
    GetTopoImage, UpdateTopoImageOrder, UpdateTopoImage
from resources.upload_resources import UploadFile
from resources.user_resources import ChangePassword, GetUsers, GetEmailTaken, CreateUser, \
    ResendUserCreateMail, LockUser, UnlockUser, UpdateUser, DeleteUser, FindUser
from models.region import Region
from models.crag import Crag
from models.sector import Sector
from models.area import Area
from models.line import Line


def configure_api(app):
    """
    Sets up all routes of the app by using flask blueprints.
    :param app: App to attach the routes to.
    """
    # Health API
    health_bp = Blueprint('health', __name__, )
    health_bp.add_url_rule('', view_func=Health.as_view('health'))
    app.register_blueprint(health_bp, url_prefix='/api/health')

    # Instance settings API
    instance_settings_bp = Blueprint('instance-settings', __name__, )
    instance_settings_bp.add_url_rule('', view_func=GetInstanceSettings.as_view('get_instance_settings'))
    instance_settings_bp.add_url_rule('', view_func=UpdateInstanceSettings.as_view('update_instance_settings'))
    app.register_blueprint(instance_settings_bp, url_prefix='/api/instance-settings')

    # Upload API
    upload_bp = Blueprint('upload', __name__, )
    upload_bp.add_url_rule('', view_func=UploadFile.as_view('upload_file'))
    app.register_blueprint(upload_bp, url_prefix='/api/upload')

    # Auth API
    auth_bp = Blueprint('auth', __name__, )
    auth_bp.add_url_rule('/login', view_func=UserLogin.as_view('login_api'))
    auth_bp.add_url_rule('/logout/refresh', view_func=UserLogoutRefresh.as_view('logout_refresh_api'))
    auth_bp.add_url_rule('/logout/access', view_func=UserLogoutAccess.as_view('logout_access_api'))
    auth_bp.add_url_rule('/token/refresh', view_func=TokenRefresh.as_view('token_refresh_api'))
    auth_bp.add_url_rule('/forgot-password', view_func=ForgotPassword.as_view('forgot_password_api'))
    auth_bp.add_url_rule('/reset-password', view_func=ResetPassword.as_view('reset_password_api'))
    auth_bp.add_url_rule('/change-password', view_func=ChangePassword.as_view('change_password'))
    app.register_blueprint(auth_bp, url_prefix='/api')

    # User API
    user_bp = Blueprint('users', __name__, )
    user_bp.add_url_rule('', view_func=GetUsers.as_view('get_user_list'))
    user_bp.add_url_rule('', view_func=CreateUser.as_view('create_user'))
    user_bp.add_url_rule('/<string:user_id>', view_func=DeleteUser.as_view('delete_user'))
    user_bp.add_url_rule('/<string:user_id>/lock', view_func=LockUser.as_view('lock_user'))
    user_bp.add_url_rule('/me',
                         view_func=UpdateUser.as_view('update_user'))
    user_bp.add_url_rule('/<string:user_id>/unlock', view_func=UnlockUser.as_view('unlock_user'))
    user_bp.add_url_rule('/<string:user_id>/resend-user-create-mail',
                         view_func=ResendUserCreateMail.as_view('resend_user_create_mail'))
    user_bp.add_url_rule('/email-taken/<email>', view_func=GetEmailTaken.as_view('get_email_taken'))
    user_bp.add_url_rule('/find/<string:query>', view_func=FindUser.as_view('find_user'))
    app.register_blueprint(user_bp, url_prefix='/api/users')

    # Line API
    line_bp = Blueprint('lines', __name__)
    line_bp.add_url_rule('/<string:line_slug>', view_func=GetLine.as_view('get_line_details'))
    line_bp.add_url_rule('/<string:line_slug>', view_func=UpdateLine.as_view('update_line'))
    line_bp.add_url_rule('/<string:line_slug>', view_func=DeleteLine.as_view('delete_line'))
    line_bp.add_url_rule('/<string:line_slug>/line-paths/update-order', view_func=UpdateLinePathOrderForLine.as_view('update_line_path_order_for_line'))
    app.register_blueprint(line_bp, url_prefix='/api/lines')

    # Area API
    area_bp = Blueprint('areas', __name__)
    area_bp.add_url_rule('/<string:area_slug>', view_func=GetArea.as_view('get_area_details'))
    area_bp.add_url_rule('/<string:area_slug>', view_func=UpdateArea.as_view('update_area'))
    area_bp.add_url_rule('/<string:area_slug>', view_func=DeleteArea.as_view('delete_area'))
    area_bp.add_url_rule('/<string:area_slug>/grades', view_func=GetAreaGrades.as_view('get_area_grades'))
    area_bp.add_url_rule('/<string:area_slug>/lines', view_func=GetLines.as_view('get_lines'))
    area_bp.add_url_rule('/<string:area_slug>/lines', view_func=CreateLine.as_view('create_line'))
    area_bp.add_url_rule('/<string:area_slug>/topo-images', view_func=GetTopoImages.as_view('get_topo_images'))
    area_bp.add_url_rule('/<string:area_slug>/topo-images', view_func=AddTopoImage.as_view('add_topo_image'))
    area_bp.add_url_rule('/<string:area_slug>/topo-images/update-order', view_func=UpdateTopoImageOrder.as_view('update_topo_image_order'))
    app.register_blueprint(area_bp, url_prefix='/api/areas')

    # Topo image API
    topo_image_bp = Blueprint('topo-images', __name__)
    topo_image_bp.add_url_rule('/<string:image_id>', view_func=DeleteTopoImage.as_view('delete_topo_image'))
    topo_image_bp.add_url_rule('/<string:image_id>', view_func=GetTopoImage.as_view('get_topo_image'))
    topo_image_bp.add_url_rule('/<string:image_id>', view_func=UpdateTopoImage.as_view('update_topo_image'))
    topo_image_bp.add_url_rule('/<string:image_id>/line-paths', view_func=CreateLinePath.as_view('create_line_path'))
    topo_image_bp.add_url_rule('/<string:image_id>/line-paths/update-order', view_func=UpdateLinePathOrder.as_view('update_line_path_order'))
    app.register_blueprint(topo_image_bp, url_prefix='/api/topo-images')

    # Line path API
    line_path_bp = Blueprint('line-paths', __name__)
    line_path_bp.add_url_rule('/<string:line_path_id>', view_func=DeleteLinePath.as_view('delete_line_path'))
    app.register_blueprint(line_path_bp, url_prefix='/api/line-paths')

    # Sector API
    sector_bp = Blueprint('sectors', __name__)
    sector_bp.add_url_rule('/<string:sector_slug>', view_func=GetSector.as_view('get_sector_details'))
    sector_bp.add_url_rule('/<string:sector_slug>', view_func=UpdateSector.as_view('update_sector'))
    sector_bp.add_url_rule('/<string:sector_slug>', view_func=DeleteSector.as_view('delete_sector'))
    sector_bp.add_url_rule('/<string:sector_slug>/grades', view_func=GetSectorGrades.as_view('get_sector_grades'))
    sector_bp.add_url_rule('/<string:sector_slug>/areas', view_func=GetAreas.as_view('get_areas'))
    sector_bp.add_url_rule('/<string:sector_slug>/areas', view_func=CreateArea.as_view('create_area'))
    sector_bp.add_url_rule('/<string:sector_slug>/areas/update-order', view_func=UpdateAreaOrder.as_view('update_area_order'))
    app.register_blueprint(sector_bp, url_prefix='/api/sectors')

    # Crag API
    crag_bp = Blueprint('crags', __name__)
    crag_bp.add_url_rule('', view_func=GetCrags.as_view('get_crags'))
    crag_bp.add_url_rule('', view_func=CreateCrag.as_view('create_crag'))
    crag_bp.add_url_rule('/update-order', view_func=UpdateCragOrder.as_view('update_crag_order'))
    crag_bp.add_url_rule('/<string:crag_slug>', view_func=GetCrag.as_view('get_crag_details'))
    crag_bp.add_url_rule('/<string:crag_slug>', view_func=UpdateCrag.as_view('update_crag'))
    crag_bp.add_url_rule('/<string:crag_slug>', view_func=DeleteCrag.as_view('delete_crag'))
    crag_bp.add_url_rule('/<string:crag_slug>/grades', view_func=GetCragGrades.as_view('get_crag_grades'))
    crag_bp.add_url_rule('/<string:crag_slug>/sectors', view_func=GetSectors.as_view('get_sectors'))
    crag_bp.add_url_rule('/<string:crag_slug>/sectors', view_func=CreateSector.as_view('create_sector'))
    crag_bp.add_url_rule('/<string:crag_slug>/sectors/update-order', view_func=UpdateSectorOrder.as_view('update_sector_order'))
    app.register_blueprint(crag_bp, url_prefix='/api/crags')

    # Region API
    region_bp = Blueprint('region', __name__)
    region_bp.add_url_rule('', view_func=GetRegion.as_view('get_region_details'))
    region_bp.add_url_rule('', view_func=UpdateRegion.as_view('update_region'))
    region_bp.add_url_rule('/grades', view_func=GetRegionGrades.as_view('get_region_grades'))
    app.register_blueprint(region_bp, url_prefix='/api/region')

    # Post API
    post_bp = Blueprint('posts', __name__)
    post_bp.add_url_rule('', view_func=GetPosts.as_view('get_posts'))
    post_bp.add_url_rule('', view_func=CreatePost.as_view('create_post'))
    post_bp.add_url_rule('/<string:post_slug>', view_func=GetPost.as_view('get_post'))
    post_bp.add_url_rule('/<string:post_slug>', view_func=DeletePost.as_view('delete_post'))
    post_bp.add_url_rule('/<string:post_slug>', view_func=UpdatePost.as_view('update_post'))
    app.register_blueprint(post_bp, url_prefix='/api/posts')

    # Menu pages API
    menu_page_bp = Blueprint('menu-pages', __name__)
    menu_page_bp.add_url_rule('', view_func=GetMenuPages.as_view('get_menu_pages'))
    menu_page_bp.add_url_rule('', view_func=CreateMenuPage.as_view('create_menu_page'))
    menu_page_bp.add_url_rule('/<string:menu_page_slug>', view_func=GetMenuPage.as_view('get_menu_page'))
    menu_page_bp.add_url_rule('/<string:menu_page_slug>', view_func=DeleteMenuPage.as_view('delete_menu_page'))
    menu_page_bp.add_url_rule('/<string:menu_page_slug>', view_func=UpdateMenuPage.as_view('update_menu_page'))
    app.register_blueprint(menu_page_bp, url_prefix='/api/menu-pages')

    # Menu items API
    menu_item_bp = Blueprint('menu-items', __name__)
    menu_item_bp.add_url_rule('', view_func=GetMenuItems.as_view('get_manu_items'))
    menu_item_bp.add_url_rule('', view_func=CreateMenuItem.as_view('create_menu_item'))
    menu_item_bp.add_url_rule('/<string:menu_item_id>', view_func=GetMenuItem.as_view('get_menu_item'))
    menu_item_bp.add_url_rule('/<string:menu_item_id>', view_func=DeleteMenuItem.as_view('delete_menu_item'))
    menu_item_bp.add_url_rule('/<string:menu_item_id>', view_func=UpdateMenuItem.as_view('update_menu_item'))
    menu_item_bp.add_url_rule('/update-order-top', view_func=UpdateMenuItemTopOrder.as_view('update_menu_item_top_order'))
    menu_item_bp.add_url_rule('/update-order-bottom', view_func=UpdateMenuItemBottomOrder.as_view('update_menu_item_bottom_order'))
    app.register_blueprint(menu_item_bp, url_prefix='/api/menu-items')
