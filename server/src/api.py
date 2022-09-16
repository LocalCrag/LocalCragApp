from email.policy import default
from flask import Blueprint

# # noinspection PyUnresolvedReferences
# from models.entity_type import EntityType
# # noinspection PyUnresolvedReferences
# from models.experiment_step_grammar import ExperimentStepGrammar
# # noinspection PyUnresolvedReferences
# from models.experiment_step_instance import ExperimentStepInstance
# # noinspection PyUnresolvedReferences
# from models.experiment_variant import ExperimentVariant
# # noinspection PyUnresolvedReferences
# from models.experiment_variant_set import ExperimentVariantSet
# # noinspection PyUnresolvedReferences
# from models.file import File
# # noinspection PyUnresolvedReferences
# from models.internal_entity_accessor import InternalEntityAccessor
# # noinspection PyUnresolvedReferences
# from models.literature import Literature
# # noinspection PyUnresolvedReferences
# from models.nicknamed_device import NicknamedDevice
# # noinspection PyUnresolvedReferences
# from models.organisation import Organisation
# # noinspection PyUnresolvedReferences
# from models.permission import UserPermission
# # noinspection PyUnresolvedReferences
# from models.permission_group import PermissionGroup
# # noinspection PyUnresolvedReferences
# from models.project_category import ProjectCategory
# # noinspection PyUnresolvedReferences
# from models.user import User
from resources.account_settings_resources import GetAccountSettings, UpdateAccountSettings
from resources.analysis_resources import GetAnalyses, CreateAnalysis, DeleteAnalysis, UpdateAnalysis, GetAnalysis
from resources.auth_resources import UserLogin, UserLogoutRefresh, UserLogoutAccess, TokenRefresh, \
    ForgotPassword, ResetPassword
from resources.chemical_batch_resources import CreateChemicalBatch, GetChemicalBatch, DeleteChemicalBatch, \
    UpdateChemicalBatch, GetChemicalBatches
from resources.chemical_resources import GetChemicals, CreateChemical, GetChemical, UpdateChemical, DeleteChemical, FindChemical
from resources.device_resources import CreateDevice, GetDevices, GetDevice, UpdateDevice, DeleteDevice, FindDevice
from resources.discussion_resources import CreateDiscussion, CreateDiscussionMessage, ResolveDiscussion, \
    GetDiscussions, GetDiscussion
from resources.experiment_resources import FindExperiment, GetExperiments, CreateExperiment, GetExperiment, DeleteExperiment, \
    UpdateExperiment, GetExperimentSetExperiments, AddExperimentToExperimentSet, \
    GetExperimentSetExperimentsWithVariants, UpdateExperimentAndVariantSetResults
from resources.experiment_type_resources import GetExperimentTypes, GetExperimentType, CreateExperimentType, \
    UpdateExperimentType, DeleteExperimentType
from resources.experiment_set_resources import GetExperimentSets, CreateExperimentSet, GetExperimentSet, \
    UpdateExperimentSet, DeleteExperimentSet, UpdateExperimentSetPlateConfig, AddExperimentSetMember, \
    GetExperimentSetMembers, UpdateExperimentSetMember, DeleteExperimentSetMember
from resources.experiment_step_grammar_category_resources import CreateGrammarCategory, GetGrammarCategories, \
    GetGrammarCategory, UpdateGrammarCategory, DeleteGrammarCategory
from resources.experiment_step_grammar_resources import CreateGrammar, GetGrammars, GetGrammar, UpdateGrammar, \
    DeleteGrammar, FindGrammar
from resources.experiment_step_modality_resources import GetExperimentStepModalities
from resources.experiment_variant_results_resources import CreateOrUpdateExperimentVariantSetResults, \
    GetExperimentVariantSetResults
from resources.experiment_variant_set_resources import CreateExperimentVariantSet, DeleteExperimentVariantSet, \
    UpdateExperimentVariantSet, GetExperimentVariantSet
from resources.export_resources import CreateExport, DownloadExport
from resources.language_resources import GetLanguages
from resources.measurand_resources import CreateMeasurand, UpdateMeasurand, DeleteMeasurand, GetMeasurand, GetMeasurands
from resources.measurand_specialisation_resources import CreateMeasurandSpecialisation, UpdateMeasurandSpecialisation, \
    DeleteMeasurandSpecialisation, FindMeasurandSpecialisation
from resources.media_resources import SvgToPng
from resources.nicknamed_device_resources import CreateNicknamedDevice, UpdateNicknamedDevice
from resources.permission_group_resources import GetPermissionGroups
from resources.project_category_resources import GetProjectCategories
from resources.project_resources import CreateProject, GetProjects, GetProject, UpdateProject, DeleteProject, \
    AddProjectMember, GetProjectMembers, UpdateProjectMember, DeleteProjectMember, GetCustomerProjects, GetCustomerProjects
from resources.role_resources import GetRoles, GetRole, UpdateRole, CreateRole, DeleteRole, GetRoleNameTaken, \
    GetProjectRoles, GetUserRoles, GetUserPermissions, GetProjectPermissions, GetProjectRole
from resources.subject_resources import FindSubjects, GetSubject
from resources.task_resources import CreateTask, GetArchiveTasks, GetPendingTasks, \
    GetTodoTasks, GetTask, AcceptTask, RejectTask, EditTask, FinishTask, ArchiveTask, CancelTask
from resources.unit_resources import CreateUnit, GetUnits, GetUnit, UpdateUnit, DeleteUnit, GetQuantityMeasurandUnits, \
    GetConcentrationMeasurandUnits
from resources.upload_resources import UploadMedia, UploadFile
from resources.user_resources import ChangePassword, GetUsers, GetUser, GetEmailTaken, CreateUser, \
    ResendUserCreateMail, LockUser, UnlockUser, UpdateUserContactInfo, UpdateUserPermissions, DeleteUser, \
    UpdateUserAccountSettings, FindUser
from resources.configuration_resources import GetConfigurations, CreateConfiguration, UpdateConfiguration, \
    GetConfiguration, DeleteConfiguration
from resources.method_resources import GetMethods, CreateMethod, UpdateMethod, GetMethod, DeleteMethod
from resources.calibration_resources import GetCalibrations, CreateCalibration, UpdateCalibration, GetCalibration, \
    DeleteCalibration
from resources.customer_resources import GetCustomers, GetCustomer, CreateCustomer, UpdateCustomer, DeleteCustomer
from resources.device_readings_resources import CreateDeviceReadings

#todo clean up

def configure_api(app):
    """
    Sets up all routes of the app by using flask blueprints.
    :param app: App to attach the routes to.
    """
    # Upload API
    subject_bp = Blueprint('upload', __name__, )
    subject_bp.add_url_rule('/media', view_func=UploadMedia.as_view('upload_media'))
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
    account_bp.add_url_rule('/settings', view_func=GetAccountSettings.as_view('get_account_settings'))
    account_bp.add_url_rule('/settings', view_func=UpdateAccountSettings.as_view('update_account_settings'))
    app.register_blueprint(account_bp, url_prefix='/api/account')

    # Language API
    language_bp = Blueprint('languages', __name__, )
    language_bp.add_url_rule('', view_func=GetLanguages.as_view('get_language_list'))
    app.register_blueprint(language_bp, url_prefix='/api/languages')

    # Media API
    media_bp = Blueprint('medias', __name__, )
    media_bp.add_url_rule('svg-to-png', view_func=SvgToPng.as_view('svg_to_png'))
    app.register_blueprint(media_bp, url_prefix='/api/medias')

    # User API
    user_bp = Blueprint('users', __name__, )
    user_bp.add_url_rule('', view_func=GetUsers.as_view('get_user_list'))
    user_bp.add_url_rule('', view_func=CreateUser.as_view('create_user'))
    user_bp.add_url_rule('/<int:user_id>', view_func=GetUser.as_view('get_user_detail'))
    user_bp.add_url_rule('/<int:user_id>', view_func=DeleteUser.as_view('delete_user'))
    user_bp.add_url_rule('/<int:user_id>/lock', view_func=LockUser.as_view('lock_user'))
    user_bp.add_url_rule('/<int:user_id>/contact-info',
                         view_func=UpdateUserContactInfo.as_view('update_user_contact_info'))
    user_bp.add_url_rule('/<int:user_id>/account-settings',
                         view_func=UpdateUserAccountSettings.as_view('update_user_account_settings'))
    user_bp.add_url_rule('/<int:user_id>/permissions',
                         view_func=UpdateUserPermissions.as_view('update_user_permissions'))
    user_bp.add_url_rule('/<int:user_id>/unlock', view_func=UnlockUser.as_view('unlock_user'))
    user_bp.add_url_rule('/<int:user_id>/resend-user-create-mail',
                         view_func=ResendUserCreateMail.as_view('resend_user_create_mail'))
    user_bp.add_url_rule('/email-taken/<email>', view_func=GetEmailTaken.as_view('get_email_taken'))
    user_bp.add_url_rule('/find/<string:query>', view_func=FindUser.as_view('find_user'))
    app.register_blueprint(user_bp, url_prefix='/api/users')

    # Roles API
    role_bp = Blueprint('roles', __name__, )
    role_bp.add_url_rule('', view_func=GetRoles.as_view('get_role_list'))
    role_bp.add_url_rule('/project-roles', view_func=GetProjectRoles.as_view('get_project_role_list'))
    role_bp.add_url_rule('/user-roles', view_func=GetUserRoles.as_view('get_user_role_list'))
    role_bp.add_url_rule('', view_func=CreateRole.as_view('create_role'))
    role_bp.add_url_rule('/<int:role_id>', view_func=GetRole.as_view('get_role_detail'))
    role_bp.add_url_rule('/project-roles/<int:role_id>', view_func=GetProjectRole.as_view('get_project_role_detail'))
    role_bp.add_url_rule('/name-taken/<name>', view_func=GetRoleNameTaken.as_view('get_role_name_taken'))
    role_bp.add_url_rule('/<int:role_id>', view_func=UpdateRole.as_view('update_role'))
    role_bp.add_url_rule('/<int:role_id>', view_func=DeleteRole.as_view('delete_role'))
    role_bp.add_url_rule('/permission-groups', view_func=GetPermissionGroups.as_view('get_permission-groups'))
    role_bp.add_url_rule('/user-permissions', view_func=GetUserPermissions.as_view('get_user_permissions'))
    role_bp.add_url_rule('/project-permissions', view_func=GetProjectPermissions.as_view('get_project_permissions'))
    app.register_blueprint(role_bp, url_prefix='/api/roles')

    # Unit API
    units_bp = Blueprint('units', __name__, )
    units_bp.add_url_rule('/<int:unit_id>', view_func=GetUnit.as_view('get_unit_detail'))
    units_bp.add_url_rule('/<int:unit_id>', view_func=UpdateUnit.as_view('update_unit'))
    units_bp.add_url_rule('/<int:unit_id>', view_func=DeleteUnit.as_view('delete_unit'))
    units_bp.add_url_rule('/quantities', view_func=GetQuantityMeasurandUnits.as_view('get_quantity_measurand_units'))
    units_bp.add_url_rule('/concentrations', view_func=GetConcentrationMeasurandUnits.as_view('get_concentration_measurand_units'))
    app.register_blueprint(units_bp, url_prefix='/api/units')

    # Measurand API
    measurands_bp = Blueprint('measurands', __name__, )
    measurands_bp.add_url_rule('', view_func=CreateMeasurand.as_view('create_measurand'))
    measurands_bp.add_url_rule('', view_func=GetMeasurands.as_view('get_measurand_list'))
    measurands_bp.add_url_rule('/<int:measurand_id>', view_func=UpdateMeasurand.as_view('update_measurand'))
    measurands_bp.add_url_rule('/<int:measurand_id>', view_func=DeleteMeasurand.as_view('delete_measurand'))
    measurands_bp.add_url_rule('/<int:measurand_id>', view_func=GetMeasurand.as_view('get_measurand'))
    measurands_bp.add_url_rule('<int:measurand_id>/specialisations',
                               view_func=CreateMeasurandSpecialisation.as_view('create_measurand_specialisation'))
    measurands_bp.add_url_rule('specialisations/find/<string:query>',
                               view_func=FindMeasurandSpecialisation.as_view('find_measurand_specialisation'))
    measurands_bp.add_url_rule('specialisations/<int:measurand_specialisation_id>',
                               view_func=UpdateMeasurandSpecialisation.as_view('update_measurand_specialisation'))
    measurands_bp.add_url_rule('specialisations/<int:measurand_specialisation_id>',
                               view_func=DeleteMeasurandSpecialisation.as_view('delete_measurand_specialisation'))
    measurands_bp.add_url_rule('/<int:measurand_id>/units', view_func=GetUnits.as_view('get_unit_list'))
    measurands_bp.add_url_rule('/<int:measurand_id>/units', view_func=CreateUnit.as_view('create_unit'))

    app.register_blueprint(measurands_bp, url_prefix='/api/measurands')

    # Chemical API
    chemicals_bp = Blueprint('chemicals', __name__, )
    chemicals_bp.add_url_rule('', view_func=CreateChemical.as_view('create_chemical'))
    chemicals_bp.add_url_rule('', view_func=GetChemicals.as_view('get_chemical_list'))
    chemicals_bp.add_url_rule('/<int:chemical_id>', view_func=GetChemical.as_view('get_chemical_detail'))
    chemicals_bp.add_url_rule('/find/<string:query>', view_func=FindChemical.as_view('find_chemical'))
    chemicals_bp.add_url_rule('/<int:chemical_id>', view_func=UpdateChemical.as_view('update_chemical'))
    chemicals_bp.add_url_rule('/<int:chemical_id>', view_func=DeleteChemical.as_view('delete_chemical'))
    chemicals_bp.add_url_rule('/<int:chemical_id>/batches',
                              view_func=CreateChemicalBatch.as_view('create_chemical_batch'))
    chemicals_bp.add_url_rule('/<int:chemical_id>/batches',
                              view_func=GetChemicalBatches.as_view('get_chemical_batch_list'))
    chemicals_bp.add_url_rule('/batches/<int:chemical_id>', view_func=GetChemicalBatch.as_view('get_chemical_batch'))
    chemicals_bp.add_url_rule('/batches/<int:chemical_id>',
                              view_func=DeleteChemicalBatch.as_view('delete_chemical_batch'))
    chemicals_bp.add_url_rule('/batches/<int:chemical_id>',
                              view_func=UpdateChemicalBatch.as_view('update_chemical_batch'))
    app.register_blueprint(chemicals_bp, url_prefix='/api/chemicals')

    # Device API
    devices_bp = Blueprint('devices', __name__, )
    devices_bp.add_url_rule('', view_func=CreateDevice.as_view('create_device'))
    devices_bp.add_url_rule('', view_func=GetDevices.as_view('get_device_list'))
    devices_bp.add_url_rule('/<int:device_id>', view_func=GetDevice.as_view('get_device_detail'))
    devices_bp.add_url_rule('/<int:device_id>', view_func=UpdateDevice.as_view('update_device'))
    devices_bp.add_url_rule('/<int:device_id>', view_func=DeleteDevice.as_view('delete_device'))
    devices_bp.add_url_rule('/find/<string:query>', view_func=FindDevice.as_view('find_device'))
    devices_bp.add_url_rule('/<int:device_id>/configurations', view_func=GetConfigurations.as_view('get_configuration_list'))
    devices_bp.add_url_rule('/<int:device_id>/configurations', view_func=CreateConfiguration.as_view('create_configuration'))
    app.register_blueprint(devices_bp, url_prefix='/api/devices')

    # Configuration API
    configuration_bp = Blueprint('configurations', __name__)
    configuration_bp.add_url_rule('/<int:configuration_id>', view_func=GetConfiguration.as_view('get_configuration_detail'))
    configuration_bp.add_url_rule('/<int:configuration_id>', view_func=UpdateConfiguration.as_view('update_configuration'))
    configuration_bp.add_url_rule('/<int:configuration_id>', view_func=DeleteConfiguration.as_view('delete_configuration'))
    configuration_bp.add_url_rule('/<int:configuration_id>/methods', view_func=GetMethods.as_view('get_method_list'))
    configuration_bp.add_url_rule('/<int:configuration_id>/methods', view_func=CreateMethod.as_view('create_method'))
    app.register_blueprint(configuration_bp, url_prefix='/api/configurations')

    # Method API
    method_bp = Blueprint('methods', __name__)
    method_bp.add_url_rule('/<int:method_id>', view_func=GetMethod.as_view('get_method_detail'))
    method_bp.add_url_rule('/<int:method_id>', view_func=UpdateMethod.as_view('update_method'))
    method_bp.add_url_rule('/<int:method_id>', view_func=DeleteMethod.as_view('delete_method'))
    method_bp.add_url_rule('/<int:method_id>/calibrations', view_func=GetCalibrations.as_view('get_calibration_list'))
    method_bp.add_url_rule('/<int:method_id>/calibrations', view_func=CreateCalibration.as_view('create_calibration'))
    app.register_blueprint(method_bp, url_prefix='/api/methods')

    # Calibration API
    calibrations_bp = Blueprint('calibrations', __name__)
    calibrations_bp.add_url_rule('/<int:calibration_id>', view_func=GetCalibration.as_view('get_calibration_detail'))
    calibrations_bp.add_url_rule('/<int:calibration_id>', view_func=UpdateCalibration.as_view('update_calibration'))
    calibrations_bp.add_url_rule('/<int:calibration_id>', view_func=DeleteCalibration.as_view('delete_calibration'))
    app.register_blueprint(calibrations_bp, url_prefix='/api/calibrations')

    # Experiment Step Modality API
    experiment_step_modalities_bp = Blueprint('experiment_step_modalities', __name__, )
    experiment_step_modalities_bp.add_url_rule('', view_func=GetExperimentStepModalities.as_view(
        'get_experiment_step_modality_list'))
    app.register_blueprint(experiment_step_modalities_bp, url_prefix='/api/experiment-step-modalities')

    # Experiment Step Grammar API
    experiment_step_grammar_bp = Blueprint('experiment-step-grammars', __name__, )
    experiment_step_grammar_bp.add_url_rule('', view_func=CreateGrammar.as_view('create_grammar'))
    experiment_step_grammar_bp.add_url_rule('', view_func=GetGrammars.as_view('get_grammar_list'))
    experiment_step_grammar_bp.add_url_rule('/<int:grammar_id>', view_func=GetGrammar.as_view('get_grammar_detail'))
    experiment_step_grammar_bp.add_url_rule('/<int:grammar_id>', view_func=UpdateGrammar.as_view('update_grammar'))
    experiment_step_grammar_bp.add_url_rule('/<int:grammar_id>', view_func=DeleteGrammar.as_view('delete_grammar'))
    experiment_step_grammar_bp.add_url_rule('/find/<string:query>', view_func=FindGrammar.as_view('find_grammar'))
    experiment_step_grammar_bp.add_url_rule('/categories',
                                            view_func=CreateGrammarCategory.as_view('create_grammar_category'))
    experiment_step_grammar_bp.add_url_rule('/categories',
                                            view_func=GetGrammarCategories.as_view('get_grammar_category_list'))
    experiment_step_grammar_bp.add_url_rule('/categories/<int:grammar_category_id>',
                                            view_func=GetGrammarCategory.as_view('get_grammar_category_detail'))
    experiment_step_grammar_bp.add_url_rule('/categories/<int:grammar_category_id>',
                                            view_func=UpdateGrammarCategory.as_view('update_grammar_category'))
    experiment_step_grammar_bp.add_url_rule('/categories/<int:grammar_category_id>',
                                            view_func=DeleteGrammarCategory.as_view('delete_grammar_category'))
    app.register_blueprint(experiment_step_grammar_bp, url_prefix='/api/experiment-step-grammars')

    # Project API
    projects_bp = Blueprint('projects', __name__, )
    projects_bp.add_url_rule('', view_func=CreateProject.as_view('create_project'))
    projects_bp.add_url_rule('', view_func=GetProjects.as_view('get_project_list'))
    projects_bp.add_url_rule('/<string:hash_id>', view_func=GetProject.as_view('get_project_detail'))
    projects_bp.add_url_rule('/<string:hash_id>', view_func=UpdateProject.as_view('update_project'))
    projects_bp.add_url_rule('/<string:hash_id>', view_func=DeleteProject.as_view('delete_project'))
    projects_bp.add_url_rule('/categories', view_func=GetProjectCategories.as_view('get_project_category_list'))
    projects_bp.add_url_rule('/<string:hash_id>/experiment-sets',
                             view_func=GetExperimentSets.as_view('get_project_experiment_set_list'))
    projects_bp.add_url_rule('/<string:hash_id>/experiment-sets',
                             view_func=CreateExperimentSet.as_view('create_experiment_set'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>',
                             view_func=GetExperimentSet.as_view('get_experiment_set'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>',
                             view_func=UpdateExperimentSet.as_view('update_experiment_set'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/update-plate-config',
                             view_func=UpdateExperimentSetPlateConfig.as_view('update_experiment_set_plate_config'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>',
                             view_func=DeleteExperimentSet.as_view('delete_experiment_set'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/experiments',
                             view_func=GetExperimentSetExperiments.as_view('get_experiment_set_experiments'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/experiments-with-variants',
                             view_func=GetExperimentSetExperimentsWithVariants.as_view(
                                 'get_experiment_set_experiments_with_variants'))
    projects_bp.add_url_rule('/<string:project_hash_id>/members',
                             view_func=AddProjectMember.as_view('add_project_member'))
    projects_bp.add_url_rule('/<string:project_hash_id>/members',
                             view_func=GetProjectMembers.as_view('get_project_members'))
    projects_bp.add_url_rule('/<string:project_hash_id>/members/<int:project_member_id>',
                             view_func=UpdateProjectMember.as_view('update_project_members'))
    projects_bp.add_url_rule('/<string:project_hash_id>/members/<int:member_id>',
                             view_func=DeleteProjectMember.as_view('delete_project_members'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/members',
                             view_func=AddExperimentSetMember.as_view('add_experiment_set_member'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/members',
                             view_func=GetExperimentSetMembers.as_view('get_experiment_set_members'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/members/<int:experiment_set_member_id>',
                             view_func=UpdateExperimentSetMember.as_view('update_experiment_set_members'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/members/<int:member_id>',
                             view_func=DeleteExperimentSetMember.as_view('delete_experiment_set_members'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/analyses',
                             view_func=GetAnalyses.as_view('get_experiment_set_analyses'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/analyses',
                             view_func=CreateAnalysis.as_view('create_experiment_set_analysis'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/analyses/<string:hash_id>',
                             view_func=DeleteAnalysis.as_view('delete_experiment_set_analysis'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/analyses/<string:hash_id>',
                             view_func=UpdateAnalysis.as_view('update_experiment_set_analysis'))
    projects_bp.add_url_rule('/experiment-sets/<string:experiment_set_hash_id>/analyses/<string:hash_id>',
                             view_func=GetAnalysis.as_view('get_experiment_set_analysis'))

    app.register_blueprint(projects_bp, url_prefix='/api/projects')

    # Experiment API
    experiments_bp = Blueprint('experiments', __name__, )
    experiments_bp.add_url_rule('', view_func=GetExperiments.as_view('get_experiment_list'))
    experiments_bp.add_url_rule('', view_func=CreateExperiment.as_view('create_experiment'))
    experiments_bp.add_url_rule('/<string:hash_id>', view_func=GetExperiment.as_view('get_experiment_detail'))
    experiments_bp.add_url_rule('/<string:hash_id>', view_func=DeleteExperiment.as_view('delete_experiment'))
    experiments_bp.add_url_rule('/<string:hash_id>', view_func=UpdateExperiment.as_view('update_experiment'))
    experiments_bp.add_url_rule('/find/<string:query>', view_func=FindExperiment.as_view('find_experiment'))
    experiments_bp.add_url_rule('/nicknamed-devices',
                                view_func=CreateNicknamedDevice.as_view('create_nicknamed_device'))
    experiments_bp.add_url_rule('/nicknamed-devices/<int:nicknamed_device_id>',
                                view_func=UpdateNicknamedDevice.as_view('update_nicknamed_device'))
    experiments_bp.add_url_rule('/<string:hash_id>/add-to-experiment-set',
                                view_func=AddExperimentToExperimentSet.as_view('add_experiment_to_experiment_set'))
    app.register_blueprint(experiments_bp, url_prefix='/api/experiments')

    # Experiment Type API
    experiment_types_bp = Blueprint('experiment_types', __name__, )
    experiment_types_bp.add_url_rule('', view_func=GetExperimentTypes.as_view('get_experiment_types_list'))
    experiment_types_bp.add_url_rule('', view_func=CreateExperimentType.as_view('create_experiment_type'))
    experiment_types_bp.add_url_rule('<int:id>', view_func=GetExperimentType.as_view('get_experiment_type_detail'))
    experiment_types_bp.add_url_rule('<int:id>', view_func=UpdateExperimentType.as_view('update_experiment_type'))
    experiment_types_bp.add_url_rule('<int:id>', view_func=DeleteExperimentType.as_view('delete_experiment_type'))
    app.register_blueprint(experiment_types_bp, url_prefix='/api/experiment_types')

    # Experiment Variant Set API
    experiment_variant_sets_bp = Blueprint('experiment-variant-sets', __name__, )
    experiment_variant_sets_bp.add_url_rule('', view_func=CreateExperimentVariantSet.as_view(
        'create_experiment_variant_set'))
    experiment_variant_sets_bp.add_url_rule('/<string:variant_set_hash_id>',
                                            view_func=GetExperimentVariantSet.as_view(
                                                'get_experiment_variant_set'))
    experiment_variant_sets_bp.add_url_rule('/<string:variant_set_hash_id>/results',
                                            view_func=CreateOrUpdateExperimentVariantSetResults.as_view(
                                                'create_experiment_variant_set_results'))
    experiment_variant_sets_bp.add_url_rule('/<string:variant_set_hash_id>/verification',
                                            view_func=UpdateExperimentAndVariantSetResults.as_view(
                                                'verify_experiment_for_results'))
    experiment_variant_sets_bp.add_url_rule('/<string:variant_set_hash_id>/results',
                                            view_func=GetExperimentVariantSetResults.as_view(
                                                'get_experiment_variant_set_results'))
    experiment_variant_sets_bp.add_url_rule('/<string:variant_set_hash_id>',
                                            view_func=DeleteExperimentVariantSet.as_view(
                                                'delete_experiment_variant_set'))
    experiment_variant_sets_bp.add_url_rule('/<string:variant_set_hash_id>',
                                            view_func=UpdateExperimentVariantSet.as_view(
                                                'update_experiment_variant_set'))
    app.register_blueprint(experiment_variant_sets_bp, url_prefix='/api/experiment-variant-sets')

    # Tasks API
    task_bp = Blueprint('tasks', __name__)
    task_bp.add_url_rule('', view_func=CreateTask.as_view('create_task'))
    task_bp.add_url_rule('/todo', view_func=GetTodoTasks.as_view('get_todo_tasks'))
    task_bp.add_url_rule('/pending', view_func=GetPendingTasks.as_view('get_pending_tasks'))
    task_bp.add_url_rule('/archive', view_func=GetArchiveTasks.as_view('get_archive_tasks'))
    task_bp.add_url_rule('/<string:hash_id>', view_func=GetTask.as_view('get_task'))
    task_bp.add_url_rule('/<string:hash_id>/accept', view_func=AcceptTask.as_view('accept_task'))
    task_bp.add_url_rule('/<string:hash_id>/reject', view_func=RejectTask.as_view('reject_task'))
    task_bp.add_url_rule('/<string:hash_id>', view_func=EditTask.as_view('edit_task'))
    task_bp.add_url_rule('/<string:hash_id>/finish', view_func=FinishTask.as_view('finish_task'))
    task_bp.add_url_rule('/<string:hash_id>/archive', view_func=ArchiveTask.as_view('archive_task'))
    task_bp.add_url_rule('/<string:hash_id>/cancel', view_func=CancelTask.as_view('cancel_task'))
    task_bp.add_url_rule('/<string:task_hash_id>/discussions', view_func=CreateDiscussion.as_view('create_discussion'))
    task_bp.add_url_rule('/<string:task_hash_id>/discussions', view_func=GetDiscussions.as_view('get_discussions'))
    app.register_blueprint(task_bp, url_prefix='/api/tasks')

    # Discussion API
    discussion_bp = Blueprint('discussions', __name__)
    discussion_bp.add_url_rule('/<string:discussion_hash_id>/messages',
                               view_func=CreateDiscussionMessage.as_view('create_message'))
    discussion_bp.add_url_rule('/<string:discussion_hash_id>/resolve',
                               view_func=ResolveDiscussion.as_view('resolve_discussion'))
    discussion_bp.add_url_rule('/<string:discussion_hash_id>', view_func=GetDiscussion.as_view('get_discussion'))
    app.register_blueprint(discussion_bp, url_prefix='/api/discussions')

    # Subject API
    subject_bp = Blueprint('subjects', __name__)
    subject_bp.add_url_rule('/<string:entity_instance_id>', view_func=GetSubject.as_view('get_subject'))
    subject_bp.add_url_rule('/find/<string:query>', view_func=FindSubjects.as_view('find_subjects'))
    app.register_blueprint(subject_bp, url_prefix='/api/subjects')

    #Customer API
    customer_bp = Blueprint('customers', __name__)
    customer_bp.add_url_rule('', view_func=GetCustomers.as_view('get_customers'))
    customer_bp.add_url_rule('/<string:hash_id>', view_func=GetCustomer.as_view('get_customer_details'))
    customer_bp.add_url_rule('/<string:hash_id>/projects', view_func=GetCustomerProjects.as_view('get_customer_projects'))
    customer_bp.add_url_rule('', view_func=CreateCustomer.as_view('create_customer'))
    customer_bp.add_url_rule('/<string:hash_id>', view_func=UpdateCustomer.as_view('update_customer'))
    customer_bp.add_url_rule('/<string:hash_id>', view_func=DeleteCustomer.as_view('delete_customer'))
    app.register_blueprint(customer_bp, url_prefix='/api/customers')

    # Export API
    subject_bp = Blueprint('exports', __name__, )
    subject_bp.add_url_rule('', view_func=CreateExport.as_view('create_export'))
    subject_bp.add_url_rule('/<string:export_id>', view_func=DownloadExport.as_view('download_export'))
    app.register_blueprint(subject_bp, url_prefix='/api/exports')

    # Device Readings API
    device_readings_bp = Blueprint('device_readings', __name__, )
    device_readings_bp.add_url_rule('', view_func=CreateDeviceReadings.as_view('create_device_readings'))
    app.register_blueprint(device_readings_bp, url_prefix='/api/device-readings')
