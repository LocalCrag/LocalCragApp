from flask import Blueprint

from resources.auth_resources import UserLogin, UserLogoutRefresh, UserLogoutAccess, TokenRefresh, \
    ForgotPassword, ResetPassword
from resources.language_resources import GetLanguages
from resources.upload_resources import UploadFile
from resources.user_resources import ChangePassword, GetUsers, GetUser, GetEmailTaken, CreateUser, \
    ResendUserCreateMail, LockUser, UnlockUser, UpdateUserContactInfo, DeleteUser, FindUser


def configure_api(app):
    """
    Sets up all routes of the app by using flask blueprints.
    :param app: App to attach the routes to.
    """
    # Upload API
    subject_bp = Blueprint('upload', __name__, )
    subject_bp.add_url_rule('/file', view_func=UploadFile.as_view('upload_file'))
    app.register_blueprint(subject_bp, url_prefix='/api/upload')

    # Auth API
    auth_bp = Blueprint('auth', __name__, )
    auth_bp.add_url_rule('/login', view_func=UserLogin.as_view('login_api'))
    auth_bp.add_url_rule('/logout/refresh', view_func=UserLogoutRefresh.as_view('logout_refresh_api'))
    auth_bp.add_url_rule('/logout/access', view_func=UserLogoutAccess.as_view('logout_access_api'))
    auth_bp.add_url_rule('/token/refresh', view_func=TokenRefresh.as_view('token_refresh_api'))
    auth_bp.add_url_rule('/forgot-password', view_func=ForgotPassword.as_view('forgot_password_api'))
    auth_bp.add_url_rule('/reset-password', view_func=ResetPassword.as_view('reset_password_api'))
    app.register_blueprint(auth_bp, url_prefix='/api')

    # Account API
    account_bp = Blueprint('account', __name__, )
    account_bp.add_url_rule('/change-password', view_func=ChangePassword.as_view('change_password'))
    # account_bp.add_url_rule('/settings', view_func=UpdateAccountSettings.as_view('update_account_settings')) todo
    app.register_blueprint(account_bp, url_prefix='/api/account')

    # Language API
    language_bp = Blueprint('languages', __name__, )
    language_bp.add_url_rule('', view_func=GetLanguages.as_view('get_language_list'))
    app.register_blueprint(language_bp, url_prefix='/api/languages')

    # User API
    user_bp = Blueprint('users', __name__, )
    user_bp.add_url_rule('', view_func=GetUsers.as_view('get_user_list'))
    user_bp.add_url_rule('', view_func=CreateUser.as_view('create_user'))
    user_bp.add_url_rule('/<int:user_id>', view_func=GetUser.as_view('get_user_detail'))
    user_bp.add_url_rule('/<int:user_id>', view_func=DeleteUser.as_view('delete_user'))
    user_bp.add_url_rule('/<int:user_id>/lock', view_func=LockUser.as_view('lock_user'))
    user_bp.add_url_rule('/<int:user_id>/contact-info',
                         view_func=UpdateUserContactInfo.as_view('update_user_contact_info'))
    user_bp.add_url_rule('/<int:user_id>/unlock', view_func=UnlockUser.as_view('unlock_user'))
    user_bp.add_url_rule('/<int:user_id>/resend-user-create-mail',
                         view_func=ResendUserCreateMail.as_view('resend_user_create_mail'))
    user_bp.add_url_rule('/email-taken/<email>', view_func=GetEmailTaken.as_view('get_email_taken'))
    user_bp.add_url_rule('/find/<string:query>', view_func=FindUser.as_view('find_user'))
    app.register_blueprint(user_bp, url_prefix='/api/users')
