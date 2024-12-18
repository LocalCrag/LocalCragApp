from flask import Blueprint

from resources.archive_resources import SetArchived
from resources.area_resources import (
    CreateArea,
    DeleteArea,
    GetArea,
    GetAreaGrades,
    GetAreas,
    UpdateArea,
    UpdateAreaOrder,
)
from resources.ascent_resources import (
    CreateAscent,
    DeleteAscent,
    GetAscents,
    GetTicks,
    SendProjectClimbedMessage,
    UpdateAscent,
)
from resources.auth_resources import (
    ForgotPassword,
    ResetPassword,
    TokenRefresh,
    UserLogin,
    UserLogoutAccess,
    UserLogoutRefresh,
)
from resources.crag_resources import (
    CreateCrag,
    DeleteCrag,
    GetCrag,
    GetCragGrades,
    GetCrags,
    UpdateCrag,
    UpdateCragOrder,
)
from resources.scale_resources import GetScales, GetScale, CreateScale, UpdateScale, DeleteScale
from resources.health_resources import Health
from resources.instance_settings_resources import (
    GetInstanceSettings,
    UpdateInstanceSettings,
)
from resources.line_path_resources import (
    CreateLinePath,
    DeleteLinePath,
    UpdateLinePathOrder,
    UpdateLinePathOrderForLine,
)
from resources.line_resources import (
    CreateLine,
    DeleteLine,
    GetLine,
    GetLines,
    GetLinesForLineEditor,
    UpdateLine,
)
from resources.map_resources import GetMarkers
from resources.menu_item_resources import (
    CreateMenuItem,
    DeleteMenuItem,
    GetCragMenuStructure,
    GetMenuItem,
    GetMenuItems,
    UpdateMenuItem,
    UpdateMenuItemBottomOrder,
    UpdateMenuItemTopOrder,
)
from resources.menu_page_resources import (
    CreateMenuPage,
    DeleteMenuPage,
    GetMenuPage,
    GetMenuPages,
    UpdateMenuPage,
)
from resources.post_resources import (
    CreatePost,
    DeletePost,
    GetPost,
    GetPosts,
    UpdatePost,
)
from resources.ranking_resources import GetRanking, UpdateRanking
from resources.region_resources import GetRegion, GetRegionGrades, UpdateRegion
from resources.search_resources import Search
from resources.sector_resources import (
    CreateSector,
    DeleteSector,
    GetSector,
    GetSectorGrades,
    GetSectors,
    UpdateSector,
    UpdateSectorOrder,
)
from resources.todo_resources import (
    CreateTodo,
    DeleteTodo,
    GetIsTodo,
    GetTodos,
    UpdateTodoPriority,
)
from resources.topo_image_resources import (
    AddTopoImage,
    DeleteTopoImage,
    GetTopoImage,
    GetTopoImages,
    UpdateTopoImage,
    UpdateTopoImageOrder,
)
from resources.upload_resources import UploadFile
from resources.user_resources import (
    ChangeEmail,
    ChangePassword,
    DeleteUser,
    GetEmailTaken,
    GetUser,
    GetUserGrades,
    GetUsers,
    PromoteUser,
    RegisterUser,
    ResendUserCreateMail,
    UpdateAccountSettings,
)
from resources.util_resources import SentryTest


def configure_api(app):
    """
    Sets up all routes of the app by using flask blueprints.
    :param app: App to attach the routes to.
    """
    # Utils API
    health_bp = Blueprint("utils", __name__)
    health_bp.add_url_rule("/sentry-test", view_func=SentryTest.as_view("sentry_test"))
    app.register_blueprint(health_bp, url_prefix="/api/utils")

    # Health API
    health_bp = Blueprint("health", __name__)
    health_bp.add_url_rule("", view_func=Health.as_view("health"))
    app.register_blueprint(health_bp, url_prefix="/api/health")

    # Instance settings API
    instance_settings_bp = Blueprint("instance-settings", __name__)
    instance_settings_bp.add_url_rule("", view_func=GetInstanceSettings.as_view("get_instance_settings"))
    instance_settings_bp.add_url_rule("", view_func=UpdateInstanceSettings.as_view("update_instance_settings"))
    app.register_blueprint(instance_settings_bp, url_prefix="/api/instance-settings")

    # Upload API
    upload_bp = Blueprint("upload", __name__)
    upload_bp.add_url_rule("", view_func=UploadFile.as_view("upload_file"))
    app.register_blueprint(upload_bp, url_prefix="/api/upload")

    # Search API
    search_bp = Blueprint("search", __name__)
    search_bp.add_url_rule("/<string:query>", view_func=Search.as_view("search"))
    app.register_blueprint(search_bp, url_prefix="/api/search")

    # To-do API
    todo_bp = Blueprint("todos", __name__)
    todo_bp.add_url_rule("", view_func=GetTodos.as_view("get_todos"))
    todo_bp.add_url_rule("", view_func=CreateTodo.as_view("create_todo"))
    todo_bp.add_url_rule("/<string:todo_id>", view_func=DeleteTodo.as_view("delete_todo"))
    todo_bp.add_url_rule(
        "/<string:todo_id>/update-priority", view_func=UpdateTodoPriority.as_view("update_todo_priority")
    )
    app.register_blueprint(todo_bp, url_prefix="/api/todos")

    # Auth API
    auth_bp = Blueprint("auth", __name__)
    auth_bp.add_url_rule("/login", view_func=UserLogin.as_view("login_api"))
    auth_bp.add_url_rule("/logout/refresh", view_func=UserLogoutRefresh.as_view("logout_refresh_api"))
    auth_bp.add_url_rule("/logout/access", view_func=UserLogoutAccess.as_view("logout_access_api"))
    auth_bp.add_url_rule("/token/refresh", view_func=TokenRefresh.as_view("token_refresh_api"))
    auth_bp.add_url_rule("/forgot-password", view_func=ForgotPassword.as_view("forgot_password_api"))
    auth_bp.add_url_rule("/reset-password", view_func=ResetPassword.as_view("reset_password_api"))
    auth_bp.add_url_rule("/change-password", view_func=ChangePassword.as_view("change_password"))
    app.register_blueprint(auth_bp, url_prefix="/api")

    # User API
    user_bp = Blueprint("users", __name__)
    user_bp.add_url_rule("", view_func=GetUsers.as_view("get_user_list"))
    user_bp.add_url_rule("", view_func=RegisterUser.as_view("register_user"))
    user_bp.add_url_rule("/<string:user_id>", view_func=DeleteUser.as_view("delete_user"))
    user_bp.add_url_rule("/<string:user_slug>", view_func=GetUser.as_view("get_user"))
    user_bp.add_url_rule("/<string:user_id>/promote", view_func=PromoteUser.as_view("promote_user"))
    user_bp.add_url_rule("/account", view_func=UpdateAccountSettings.as_view("update_account_settings"))
    user_bp.add_url_rule("/account/change-email", view_func=ChangeEmail.as_view("change_email"))
    user_bp.add_url_rule(
        "/<string:user_id>/resend-user-create-mail", view_func=ResendUserCreateMail.as_view("resend_user_create_mail")
    )
    user_bp.add_url_rule("/email-taken/<email>", view_func=GetEmailTaken.as_view("get_email_taken"))
    user_bp.add_url_rule("/<string:user_slug>/grades", view_func=GetUserGrades.as_view("get_user_grades"))
    app.register_blueprint(user_bp, url_prefix="/api/users")

    # Line API
    line_bp = Blueprint("lines", __name__)
    line_bp.add_url_rule("", view_func=GetLines.as_view("get_lines"))
    line_bp.add_url_rule(
        "/for-line-editor/<string:area_slug>", view_func=GetLinesForLineEditor.as_view("get_lines_for_line_editor")
    )
    line_bp.add_url_rule("/<string:line_slug>", view_func=GetLine.as_view("get_line_details"))
    line_bp.add_url_rule("/<string:line_slug>", view_func=UpdateLine.as_view("update_line"))
    line_bp.add_url_rule("/<string:line_slug>", view_func=DeleteLine.as_view("delete_line"))
    line_bp.add_url_rule(
        "/<string:line_slug>/line-paths/update-order",
        view_func=UpdateLinePathOrderForLine.as_view("update_line_path_order_for_line"),
    )
    app.register_blueprint(line_bp, url_prefix="/api/lines")

    # Ascent API
    ascent_bp = Blueprint("ascents", __name__)
    ascent_bp.add_url_rule("", view_func=CreateAscent.as_view("create_ascent"))
    ascent_bp.add_url_rule("", view_func=GetAscents.as_view("get_ascents"))
    ascent_bp.add_url_rule("/<string:ascent_id>", view_func=DeleteAscent.as_view("delete_ascent"))
    ascent_bp.add_url_rule("/<string:ascent_id>", view_func=UpdateAscent.as_view("update_ascent"))
    ascent_bp.add_url_rule(
        "/send-project-climbed-message", view_func=SendProjectClimbedMessage.as_view("send_project_climbed_message")
    )
    app.register_blueprint(ascent_bp, url_prefix="/api/ascents")

    # Ranking API
    ranking_bp = Blueprint("ranking", __name__)
    ranking_bp.add_url_rule("", view_func=GetRanking.as_view("get_ranking"))
    ranking_bp.add_url_rule("/update", view_func=UpdateRanking.as_view("update_ranking"))
    app.register_blueprint(ranking_bp, url_prefix="/api/ranking")

    # Ticks API
    tick_bp = Blueprint("ticks", __name__)
    tick_bp.add_url_rule("", view_func=GetTicks.as_view("get_ticks"))
    app.register_blueprint(tick_bp, url_prefix="/api/ticks")

    # IsTodo API
    is_todo_bp = Blueprint("is-todo", __name__)
    is_todo_bp.add_url_rule("", view_func=GetIsTodo.as_view("get_is_todo"))
    app.register_blueprint(is_todo_bp, url_prefix="/api/is-todo")

    # Maps API
    maps_bp = Blueprint("maps", __name__)
    maps_bp.add_url_rule("/markers", view_func=GetMarkers.as_view("get_markers"))
    app.register_blueprint(maps_bp, url_prefix="/api/maps")

    # Area API
    area_bp = Blueprint("areas", __name__)
    area_bp.add_url_rule("/<string:area_slug>", view_func=GetArea.as_view("get_area_details"))
    area_bp.add_url_rule("/<string:area_slug>", view_func=UpdateArea.as_view("update_area"))
    area_bp.add_url_rule("/<string:area_slug>", view_func=DeleteArea.as_view("delete_area"))
    area_bp.add_url_rule("/<string:area_slug>/grades", view_func=GetAreaGrades.as_view("get_area_grades"))
    area_bp.add_url_rule("/<string:area_slug>/lines", view_func=CreateLine.as_view("create_line"))
    area_bp.add_url_rule("/<string:area_slug>/topo-images", view_func=GetTopoImages.as_view("get_topo_images"))
    area_bp.add_url_rule("/<string:area_slug>/topo-images", view_func=AddTopoImage.as_view("add_topo_image"))
    area_bp.add_url_rule(
        "/<string:area_slug>/topo-images/update-order",
        view_func=UpdateTopoImageOrder.as_view("update_topo_image_order"),
    )
    app.register_blueprint(area_bp, url_prefix="/api/areas")

    # Topo image API
    topo_image_bp = Blueprint("topo-images", __name__)
    topo_image_bp.add_url_rule("/<string:image_id>", view_func=DeleteTopoImage.as_view("delete_topo_image"))
    topo_image_bp.add_url_rule("/<string:image_id>", view_func=GetTopoImage.as_view("get_topo_image"))
    topo_image_bp.add_url_rule("/<string:image_id>", view_func=UpdateTopoImage.as_view("update_topo_image"))
    topo_image_bp.add_url_rule("/<string:image_id>/line-paths", view_func=CreateLinePath.as_view("create_line_path"))
    topo_image_bp.add_url_rule(
        "/<string:image_id>/line-paths/update-order", view_func=UpdateLinePathOrder.as_view("update_line_path_order")
    )
    app.register_blueprint(topo_image_bp, url_prefix="/api/topo-images")

    # Line path API
    line_path_bp = Blueprint("line-paths", __name__)
    line_path_bp.add_url_rule("/<string:line_path_id>", view_func=DeleteLinePath.as_view("delete_line_path"))
    app.register_blueprint(line_path_bp, url_prefix="/api/line-paths")

    # Sector API
    sector_bp = Blueprint("sectors", __name__)
    sector_bp.add_url_rule("/<string:sector_slug>", view_func=GetSector.as_view("get_sector_details"))
    sector_bp.add_url_rule("/<string:sector_slug>", view_func=UpdateSector.as_view("update_sector"))
    sector_bp.add_url_rule("/<string:sector_slug>", view_func=DeleteSector.as_view("delete_sector"))
    sector_bp.add_url_rule("/<string:sector_slug>/grades", view_func=GetSectorGrades.as_view("get_sector_grades"))
    sector_bp.add_url_rule("/<string:sector_slug>/areas", view_func=GetAreas.as_view("get_areas"))
    sector_bp.add_url_rule("/<string:sector_slug>/areas", view_func=CreateArea.as_view("create_area"))
    sector_bp.add_url_rule(
        "/<string:sector_slug>/areas/update-order", view_func=UpdateAreaOrder.as_view("update_area_order")
    )
    app.register_blueprint(sector_bp, url_prefix="/api/sectors")

    # Crag API
    crag_bp = Blueprint("crags", __name__)
    crag_bp.add_url_rule("", view_func=GetCrags.as_view("get_crags"))
    crag_bp.add_url_rule("", view_func=CreateCrag.as_view("create_crag"))
    crag_bp.add_url_rule("/update-order", view_func=UpdateCragOrder.as_view("update_crag_order"))
    crag_bp.add_url_rule("/<string:crag_slug>", view_func=GetCrag.as_view("get_crag_details"))
    crag_bp.add_url_rule("/<string:crag_slug>", view_func=UpdateCrag.as_view("update_crag"))
    crag_bp.add_url_rule("/<string:crag_slug>", view_func=DeleteCrag.as_view("delete_crag"))
    crag_bp.add_url_rule("/<string:crag_slug>/grades", view_func=GetCragGrades.as_view("get_crag_grades"))
    crag_bp.add_url_rule("/<string:crag_slug>/sectors", view_func=GetSectors.as_view("get_sectors"))
    crag_bp.add_url_rule("/<string:crag_slug>/sectors", view_func=CreateSector.as_view("create_sector"))
    crag_bp.add_url_rule(
        "/<string:crag_slug>/sectors/update-order", view_func=UpdateSectorOrder.as_view("update_sector_order")
    )
    app.register_blueprint(crag_bp, url_prefix="/api/crags")

    # Region API
    region_bp = Blueprint("region", __name__)
    region_bp.add_url_rule("", view_func=GetRegion.as_view("get_region_details"))
    region_bp.add_url_rule("", view_func=UpdateRegion.as_view("update_region"))
    region_bp.add_url_rule("/grades", view_func=GetRegionGrades.as_view("get_region_grades"))
    app.register_blueprint(region_bp, url_prefix="/api/region")

    # Post API
    post_bp = Blueprint("posts", __name__)
    post_bp.add_url_rule("", view_func=GetPosts.as_view("get_posts"))
    post_bp.add_url_rule("", view_func=CreatePost.as_view("create_post"))
    post_bp.add_url_rule("/<string:post_slug>", view_func=GetPost.as_view("get_post"))
    post_bp.add_url_rule("/<string:post_slug>", view_func=DeletePost.as_view("delete_post"))
    post_bp.add_url_rule("/<string:post_slug>", view_func=UpdatePost.as_view("update_post"))
    app.register_blueprint(post_bp, url_prefix="/api/posts")

    # Menu pages API
    menu_page_bp = Blueprint("menu-pages", __name__)
    menu_page_bp.add_url_rule("", view_func=GetMenuPages.as_view("get_menu_pages"))
    menu_page_bp.add_url_rule("", view_func=CreateMenuPage.as_view("create_menu_page"))
    menu_page_bp.add_url_rule("/<string:menu_page_slug>", view_func=GetMenuPage.as_view("get_menu_page"))
    menu_page_bp.add_url_rule("/<string:menu_page_slug>", view_func=DeleteMenuPage.as_view("delete_menu_page"))
    menu_page_bp.add_url_rule("/<string:menu_page_slug>", view_func=UpdateMenuPage.as_view("update_menu_page"))
    app.register_blueprint(menu_page_bp, url_prefix="/api/menu-pages")

    # Menu items API
    menu_item_bp = Blueprint("menu-items", __name__)
    menu_item_bp.add_url_rule("", view_func=GetMenuItems.as_view("get_manu_items"))
    menu_item_bp.add_url_rule("", view_func=CreateMenuItem.as_view("create_menu_item"))
    menu_item_bp.add_url_rule("/<string:menu_item_id>", view_func=GetMenuItem.as_view("get_menu_item"))
    menu_item_bp.add_url_rule("/<string:menu_item_id>", view_func=DeleteMenuItem.as_view("delete_menu_item"))
    menu_item_bp.add_url_rule("/<string:menu_item_id>", view_func=UpdateMenuItem.as_view("update_menu_item"))
    menu_item_bp.add_url_rule(
        "/update-order-top", view_func=UpdateMenuItemTopOrder.as_view("update_menu_item_top_order")
    )
    menu_item_bp.add_url_rule(
        "/update-order-bottom", view_func=UpdateMenuItemBottomOrder.as_view("update_menu_item_bottom_order")
    )
    menu_item_bp.add_url_rule("/crag-menu-structure", view_func=GetCragMenuStructure.as_view("get_crag_menu_structure"))
    app.register_blueprint(menu_item_bp, url_prefix="/api/menu-items")

    # Archive API
    archive_bp = Blueprint("archive", __name__)
    archive_bp.add_url_rule("", view_func=SetArchived.as_view("set_archived"))
    app.register_blueprint(archive_bp, url_prefix="/api/archive")

    # Scale API
    scale_bp = Blueprint("scales", __name__)
    scale_bp.add_url_rule("", view_func=GetScales.as_view("get_scales"))
    scale_bp.add_url_rule("/<string:line_type>/<string:name>", view_func=GetScale.as_view("get_scale"))
    scale_bp.add_url_rule("", view_func=CreateScale.as_view("create_scale"))
    scale_bp.add_url_rule("/<string:line_type>/<string:name>", view_func=UpdateScale.as_view("update_scale"))
    scale_bp.add_url_rule("/<string:line_type>/<string:name>", view_func=DeleteScale.as_view("delete_scale"))
    app.register_blueprint(scale_bp, url_prefix="/api/scales")
