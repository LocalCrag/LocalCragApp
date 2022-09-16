from error_handling.http_exceptions.unauthorized import Unauthorized
from extensions import db
from messages.messages import ResponseMessage
from models.account_settings import AccountSettings
from models.permission import Permission
from models.user import User
from models.user2permission import User2Permission
from util.email import send_create_user_email
from util.password_util import generate_password

# todo account changes required

def create_user(user_data, created_by=None, is_superadmin=False) -> User:
    """
    Creates a new user.
    @param user_data: User data as parsed from request.
    @param created_by: User that created the user.
    @param is_superadmin: If true, the created user will have every permission.
    @return: Created user instance.
    """
    if created_by:
        created_by_permission_dict = {p.id: p.bool_value for p in created_by.permissions if p.bool_value}
    else:
        created_by_permission_dict = {}

    password = generate_password()

    new_user = User()
    new_user.firstname = user_data['firstname']
    new_user.lastname = user_data['lastname']
    new_user.email = user_data['email']
    new_user.password = User.generate_hash(password)
    if created_by:
        new_user.created_by_id = created_by.id

    db.session.add(new_user)
    db.session.commit()

    permissions = Permission.return_all()
    permission_dict = {p['id']: p for p in user_data['permissions']}
    for p in permissions:
        new_user_2_permission = User2Permission()
        new_user_2_permission.bool_value = is_superadmin
        # Set access level and bool value if permission should be true and created_by also has the permission
        if p.id in permission_dict and p.id in created_by_permission_dict:
            new_user_2_permission.bool_value = permission_dict[p.id]['boolValue']
            new_user_2_permission.access_level_id = permission_dict[p.id]['accessLevel']
        if p.id in permission_dict and p.id not in created_by_permission_dict and (
                permission_dict[p.id]['boolValue'] or permission_dict[p.id]['accessLevel']):
            db.session.rollback()
            db.session.delete(new_user)
            db.session.commit()
            raise Unauthorized(ResponseMessage.CANNOT_CHANGE_PERMISSIONS_YOU_DONT_HAVE_YOURSELF.value)
        new_user_2_permission.permission_id = p.id
        new_user_2_permission.user_id = new_user.id
        db.session.add(new_user_2_permission)

    db.session.commit()

    # Build account settings
    new_account_settings = AccountSettings()
    new_account_settings.user_id = new_user.id
    new_account_settings.language_id = user_data['accountSettings']['language']['id']
    new_account_settings.color_scheme = 'CLARITY_BRIGHT'
    new_account_settings.persist()

    send_create_user_email(password, new_user)

    created_user = User.find_detailed_by_id(new_user.id)
    created_user.account_settings = new_account_settings

    return created_user
