import {Injectable} from '@angular/core';
import {ToastrService} from 'ngx-toastr';
import {select, Store} from '@ngrx/store';
import {NotificationType} from '../../utility/notifications/notification-type.enum';
import {HashMap, TranslocoService} from '@ngneat/transloco';
import {NotificationIdentifier} from '../../utility/notifications/notification-identifier.enum';
import {filter, take} from 'rxjs/operators';
import {AppState} from '../../ngrx/reducers';
import {selectIsMobile} from '../../ngrx/selectors/device.selectors';

/**
 * Wrapper service for the angular2-notifications.
 * Modifications are:
 *   - Prevent success and info notifications on small screens
 */
@Injectable({
  providedIn: 'root'
})
export class AppNotificationsService {

  private isMobile: boolean;

  private notificationTypeMap: Map<NotificationIdentifier, NotificationType> = new Map<NotificationIdentifier, NotificationType>([
    [NotificationIdentifier.RESULTS_SAVED, NotificationType.SUCCESS],
    /**
     * t(notifications.RESULTS_SAVED_TITLE)
     * t(notifications.RESULTS_SAVED_MESSAGE)
     **/
    [NotificationIdentifier.USER_NOT_ACTIVATED, NotificationType.ERROR],
    /**
     * t(notifications.USER_NOT_ACTIVATED_TITLE)
     * t(notifications.USER_NOT_ACTIVATED_MESSAGE)
     **/
    [NotificationIdentifier.STEP_SIZE_0_ONLY_ALLOWED_FOR_DELTA_MIN_MAX_0, NotificationType.WARNING],
    /**
     * t(notifications.STEP_SIZE_0_ONLY_ALLOWED_FOR_DELTA_MIN_MAX_0_TITLE)
     * t(notifications.STEP_SIZE_0_ONLY_ALLOWED_FOR_DELTA_MIN_MAX_0_MESSAGE)
     **/
    [NotificationIdentifier.ANALYSIS_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.ANALYSIS_CREATED_TITLE)
     * t(notifications.ANALYSIS_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.ANALYSIS_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.ANALYSIS_UPDATED_TITLE)
     * t(notifications.ANALYSIS_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_ANALYSIS_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_ANALYSIS_SUCCESS_TITLE)
     * t(notifications.DELETE_ANALYSIS_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_UPDATED_TITLE)
     * t(notifications.CHEMICAL_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_TYPE_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_TYPE_UPDATED_TITLE)
     * t(notifications.EXPERIMENT_TYPE_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_TYPE_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_TYPE_CREATED_TITLE)
     * t(notifications.EXPERIMENT_TYPE_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_EXPERIMENT_TYPE_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_EXPERIMENT_TYPE_SUCCESS_TITLE)
     * t(notifications.DELETE_EXPERIMENT_TYPE_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.ILLEGAL_TIMER_USAGE_CLEANED_UP, NotificationType.WARNING],
    /**
     * t(notifications.ILLEGAL_TIMER_USAGE_CLEANED_UP_TITLE)
     * t(notifications.ILLEGAL_TIMER_USAGE_CLEANED_UP_MESSAGE)
     **/
    [NotificationIdentifier.TIMER_CANNOT_BE_USED_IN_STEP_WHERE_ITS_CREATED, NotificationType.WARNING],
    /**
     * t(notifications.TIMER_CANNOT_BE_USED_IN_STEP_WHERE_ITS_CREATED_TITLE)
     * t(notifications.TIMER_CANNOT_BE_USED_IN_STEP_WHERE_ITS_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_TIMER_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_TIMER_DELETED_TITLE)
     * t(notifications.EXPERIMENT_STEP_TIMER_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_TIMER_SAVED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_TIMER_SAVED_TITLE)
     * t(notifications.EXPERIMENT_STEP_TIMER_SAVED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_TIMER_CONFIGURED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_TIMER_CONFIGURED_TITLE)
     * t(notifications.EXPERIMENT_STEP_TIMER_CONFIGURED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_START_EVENT_SET, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_START_EVENT_SET_TITLE)
     * t(notifications.EXPERIMENT_STEP_START_EVENT_SET_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_START_DURATION_SET, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_START_DURATION_SET_TITLE)
     * t(notifications.EXPERIMENT_STEP_START_DURATION_SET_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_GRAMMAR_CATEGORY_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_GRAMMAR_CATEGORY_CREATED_TITLE)
     * t(notifications.EXPERIMENT_STEP_GRAMMAR_CATEGORY_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_GRAMMAR_CATEGORY_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_GRAMMAR_CATEGORY_UPDATED_TITLE)
     * t(notifications.EXPERIMENT_STEP_GRAMMAR_CATEGORY_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_EXPERIMENT_STEP_GRAMMAR_CATEGORY_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_EXPERIMENT_STEP_GRAMMAR_CATEGORY_SUCCESS_TITLE)
     * t(notifications.DELETE_EXPERIMENT_STEP_GRAMMAR_CATEGORY_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.LOGIN_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.LOGIN_SUCCESS_TITLE)
     * t(notifications.LOGIN_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.SAVE_ACCOUNT_SETTINGS_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.SAVE_ACCOUNT_SETTINGS_SUCCESS_TITLE)
     * t(notifications.SAVE_ACCOUNT_SETTINGS_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CHANGE_PASSWORD_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.CHANGE_PASSWORD_SUCCESS_TITLE)
     * t(notifications.CHANGE_PASSWORD_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.FORGOT_PASSWORD_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.FORGOT_PASSWORD_SUCCESS_TITLE)
     * t(notifications.FORGOT_PASSWORD_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.RESET_PASSWORD_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.RESET_PASSWORD_SUCCESS_TITLE)
     * t(notifications.RESET_PASSWORD_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.COOKIES_ALLOWED, NotificationType.INFO],
    /**
     * t(notifications.COOKIES_ALLOWED_TITLE)
     * t(notifications.COOKIES_ALLOWED_MESSAGE)
     **/
    [NotificationIdentifier.LOGOUT_SUCCESS, NotificationType.INFO],
    /**
     * t(notifications.LOGOUT_SUCCESS_TITLE)
     * t(notifications.LOGOUT_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.AUTO_LOGOUT_SUCCESS, NotificationType.INFO],
    /**
     * t(notifications.AUTO_LOGOUT_SUCCESS_TITLE)
     * t(notifications.AUTO_LOGOUT_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.UNKNOWN_AUTHENTICATION_ERROR, NotificationType.ERROR],
    /**
     * t(notifications.UNKNOWN_AUTHENTICATION_ERROR_TITLE)
     * t(notifications.UNKNOWN_AUTHENTICATION_ERROR_MESSAGE)
     **/
    [NotificationIdentifier.UNKNOWN_ERROR, NotificationType.ERROR],
    /**
     * t(notifications.UNKNOWN_ERROR_TITLE)
     * t(notifications.UNKNOWN_ERROR_MESSAGE)
     **/
    [NotificationIdentifier.DATA_COULD_NOT_BE_LOADED, NotificationType.ERROR],
    /**
     * t(notifications.DATA_COULD_NOT_BE_LOADED_TITLE)
     * t(notifications.DATA_COULD_NOT_BE_LOADED_MESSAGE)
     **/
    [NotificationIdentifier.INVALID_FILETYPE_UPLOADED, NotificationType.ERROR],
    /**
     * t(notifications.INVALID_FILETYPE_UPLOADED_TITLE)
     * t(notifications.INVALID_FILETYPE_UPLOADED_MESSAGE)
     **/
    [NotificationIdentifier.UPLOAD_ERROR, NotificationType.ERROR],
    /**
     * t(notifications.UPLOAD_ERROR_TITLE)
     * t(notifications.UPLOAD_ERROR_MESSAGE)
     **/
    [NotificationIdentifier.FILESIZE_LIMIT_EXCEEDED, NotificationType.ERROR],
    /**
     * t(notifications.FILESIZE_LIMIT_EXCEEDED_TITLE)
     * t(notifications.FILESIZE_LIMIT_EXCEEDED_MESSAGE)
     **/
    [NotificationIdentifier.USER_ALREADY_EXISTS, NotificationType.ERROR],
    /**
     * t(notifications.USER_ALREADY_EXISTS_TITLE)
     * t(notifications.USER_ALREADY_EXISTS_MESSAGE)
     **/
    [NotificationIdentifier.USER_DOESNT_EXIST, NotificationType.ERROR],
    /**
     * t(notifications.USER_DOESNT_EXIST_TITLE)
     * t(notifications.USER_DOESNT_EXIST_MESSAGE)
     **/
    [NotificationIdentifier.USER_NOT_FOUND, NotificationType.ERROR],
    /**
     * t(notifications.USER_NOT_FOUND_TITLE)
     * t(notifications.USER_NOT_FOUND_MESSAGE)
     **/
    [NotificationIdentifier.WRONG_CREDENTIALS, NotificationType.ERROR],
    /**
     * t(notifications.WRONG_CREDENTIALS_TITLE)
     * t(notifications.WRONG_CREDENTIALS_MESSAGE)
     **/
    [NotificationIdentifier.PASSWORD_TOO_SHORT, NotificationType.ERROR],
    /**
     * t(notifications.PASSWORD_TOO_SHORT_TITLE)
     * t(notifications.PASSWORD_TOO_SHORT_MESSAGE)
     **/
    [NotificationIdentifier.UNAUTHORIZED, NotificationType.ERROR],
    /**
     * t(notifications.TENANT_DOESNT_EXIST_TITLE)
     * t(notifications.TENANT_DOESNT_EXIST_MESSAGE)
     **/
    [NotificationIdentifier.TENANT_DOESNT_EXIST, NotificationType.ERROR],
    /**
     * t(notifications.UNAUTHORIZED_TITLE)
     * t(notifications.UNAUTHORIZED_MESSAGE)
     **/
    [NotificationIdentifier.OLD_PASSWORD_INCORRECT, NotificationType.ERROR],
    /**
     * t(notifications.OLD_PASSWORD_INCORRECT_TITLE)
     * t(notifications.OLD_PASSWORD_INCORRECT_MESSAGE)
     **/
    [NotificationIdentifier.RESET_PASSWORD_HASH_INVALID, NotificationType.ERROR],
    /**
     * t(notifications.RESET_PASSWORD_HASH_INVALID_TITLE)
     * t(notifications.RESET_PASSWORD_HASH_INVALID_MESSAGE)
     **/
    [NotificationIdentifier.EMAIL_INVALID, NotificationType.ERROR],
    /**
     * t(notifications.EMAIL_INVALID_TITLE)
     * t(notifications.EMAIL_INVALID_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_ROLE_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_ROLE_SUCCESS_TITLE)
     * t(notifications.DELETE_ROLE_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CREATE_ROLE_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.CREATE_ROLE_SUCCESS_TITLE)
     * t(notifications.CREATE_ROLE_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.SAVE_ROLE_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.SAVE_ROLE_SUCCESS_TITLE)
     * t(notifications.SAVE_ROLE_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.APPLY_ROLE_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.APPLY_ROLE_SUCCESS_TITLE)
     * t(notifications.APPLY_ROLE_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.FORM_CONTAINS_ERRORS, NotificationType.ERROR],
    /**
     * t(notifications.FORM_CONTAINS_ERRORS_TITLE)
     * t(notifications.FORM_CONTAINS_ERRORS_MESSAGE)
     **/
    [NotificationIdentifier.USER_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_CREATED_TITLE)
     * t(notifications.USER_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.RESEND_USER_CREATE_MAIL_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.RESEND_USER_CREATE_MAIL_SUCCESS_TITLE)
     * t(notifications.RESEND_USER_CREATE_MAIL_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.USER_LOCKED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_LOCKED_TITLE)
     * t(notifications.USER_LOCKED_MESSAGE)
     **/
    [NotificationIdentifier.USER_UNLOCKED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_UNLOCKED_TITLE)
     * t(notifications.USER_UNLOCKED_MESSAGE)
     **/
    [NotificationIdentifier.USER_CONTACT_INFO_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_CONTACT_INFO_UPDATED_TITLE)
     * t(notifications.USER_CONTACT_INFO_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.USER_PERMISSIONS_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_PERMISSIONS_UPDATED_TITLE)
     * t(notifications.USER_PERMISSIONS_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.USER_ACCOUNT_SETTINGS_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_ACCOUNT_SETTINGS_UPDATED_TITLE)
     * t(notifications.USER_ACCOUNT_SETTINGS_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.LOG_OUT_TO_USE_THIS_FUNCTION, NotificationType.INFO],
    /**
     * t(notifications.LOG_OUT_TO_USE_THIS_FUNCTION_TITLE)
     * t(notifications.LOG_OUT_TO_USE_THIS_FUNCTION_MESSAGE)
     **/
    [NotificationIdentifier.INSUFFICIENT_PERMISSIONS, NotificationType.INFO],
    /**
     * t(notifications.INSUFFICIENT_PERMISSIONS_TITLE)
     * t(notifications.INSUFFICIENT_PERMISSIONS_MESSAGE)
     **/
    [NotificationIdentifier.CANNOT_CHANGE_PERMISSIONS_YOU_DONT_HAVE_YOURSELF, NotificationType.ERROR],
    /**
     * t(notifications.CANNOT_CHANGE_PERMISSIONS_YOU_DONT_HAVE_YOURSELF_TITLE)
     * t(notifications.CANNOT_CHANGE_PERMISSIONS_YOU_DONT_HAVE_YOURSELF_MESSAGE)
     **/
    [NotificationIdentifier.POST_UNIT_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.POST_UNIT_SUCCESS_TITLE)
     * t(notifications.POST_UNIT_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_UNIT_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_UNIT_SUCCESS_TITLE)
     * t(notifications.DELETE_UNIT_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.UNIT_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.UNIT_UPDATED_TITLE)
     * t(notifications.UNIT_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DEVICE_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.DEVICE_CREATED_TITLE)
     * t(notifications.DEVICE_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_DEVICE_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_DEVICE_SUCCESS_TITLE)
     * t(notifications.DELETE_DEVICE_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.DEVICE_GENERAL_DATA_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.DEVICE_GENERAL_DATA_UPDATED_TITLE)
     * t(notifications.DEVICE_GENERAL_DATA_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DEVICE_STORAGE_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.DEVICE_STORAGE_UPDATED_TITLE)
     * t(notifications.DEVICE_STORAGE_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DEVICE_METADATA_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.DEVICE_METADATA_UPDATED_TITLE)
     * t(notifications.DEVICE_METADATA_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_CONFIGURATION_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_CONFIGURATION_SUCCESS_TITLE)
     * t(notifications.DELETE_CONFIGURATION_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CONFIGURATION_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CONFIGURATION_CREATED_TITLE)
     * t(notifications.CONFIGURATION_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.CONFIGURATION_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CONFIGURATION_UPDATED_TITLE)
     * t(notifications.CONFIGURATION_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_METHOD_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_METHOD_SUCCESS_TITLE)
     * t(notifications.DELETE_METHOD_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.METHOD_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.METHOD_CREATED_TITLE)
     * t(notifications.METHOD_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.METHOD_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.METHOD_UPDATED_TITLE)
     * t(notifications.METHOD_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_CALIBRATION_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_CALIBRATION_SUCCESS_TITLE)
     * t(notifications.DELETE_CALIBRATION_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CALIBRATION_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CALIBRATION_CREATED_TITLE)
     * t(notifications.CALIBRATION_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.CALIBRATION_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CALIBRATION_UPDATED_TITLE)
     * t(notifications.CALIBRATION_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_CREATED_TITLE)
     * t(notifications.CHEMICAL_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_CHEMICAL_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_CHEMICAL_SUCCESS_TITLE)
     * t(notifications.DELETE_CHEMICAL_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_IDENTIFIERS_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_IDENTIFIERS_UPDATED_TITLE)
     * t(notifications.CHEMICAL_IDENTIFIERS_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_PROPERTIES_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_PROPERTIES_UPDATED_TITLE)
     * t(notifications.CHEMICAL_PROPERTIES_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_CHEMICAL_BATCH_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_CHEMICAL_BATCH_SUCCESS_TITLE)
     * t(notifications.DELETE_CHEMICAL_BATCH_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_BATCH_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_BATCH_CREATED_TITLE)
     * t(notifications.CHEMICAL_BATCH_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_BATCH_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_BATCH_UPDATED_TITLE)
     * t(notifications.CHEMICAL_BATCH_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.COPIED_TO_CLIPBOARD, NotificationType.SUCCESS],
    /**
     * t(notifications.COPIED_TO_CLIPBOARD_TITLE)
     * t(notifications.COPIED_TO_CLIPBOARD_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_CREATED_TITLE)
     * t(notifications.EXPERIMENT_STEP_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_UPDATED_TITLE)
     * t(notifications.EXPERIMENT_STEP_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_EXPERIMENT_STEP_GRAMMAR_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_EXPERIMENT_STEP_GRAMMAR_SUCCESS_TITLE)
     * t(notifications.DELETE_EXPERIMENT_STEP_GRAMMAR_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.PROJECT_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.PROJECT_CREATED_TITLE)
     * t(notifications.PROJECT_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.LITERATURE_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.LITERATURE_ADDED_TITLE)
     * t(notifications.LITERATURE_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_CREATED_TITLE)
     * t(notifications.EXPERIMENT_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_UPDATED_TITLE)
     * t(notifications.EXPERIMENT_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_EXPERIMENT_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_EXPERIMENT_SUCCESS_TITLE)
     * t(notifications.DELETE_EXPERIMENT_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.TRIED_SAVING_EMPTY_SVG, NotificationType.WARNING],
    /**
     * t(notifications.TRIED_SAVING_EMPTY_SVG_TITLE)
     * t(notifications.TRIED_SAVING_EMPTY_SVG_MESSAGE)
     **/
    [NotificationIdentifier.POST_EXPERIMENT_SET_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.POST_EXPERIMENT_SET_SUCCESS_TITLE)
     * t(notifications.POST_EXPERIMENT_SET_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_ADDED_TO_SET, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_ADDED_TO_SET_TITLE)
     * t(notifications.EXPERIMENT_ADDED_TO_SET_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_SET_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_SET_UPDATED_TITLE)
     * t(notifications.EXPERIMENT_SET_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_EXPERIMENT_SET_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_EXPERIMENT_SET_SUCCESS_TITLE)
     * t(notifications.DELETE_EXPERIMENT_SET_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_PROJECT_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_PROJECT_SUCCESS_TITLE)
     * t(notifications.DELETE_PROJECT_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.STEP_SIZE_WAS_BIGGER_DELTA_MIN_MAX, NotificationType.WARNING],
    /**
     * t(notifications.STEP_SIZE_WAS_BIGGER_DELTA_MIN_MAX_TITLE)
     * t(notifications.STEP_SIZE_WAS_BIGGER_DELTA_MIN_MAX_MESSAGE)
     **/
    [NotificationIdentifier.VARIANT_SET_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.VARIANT_SET_CREATED_TITLE)
     * t(notifications.VARIANT_SET_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.VARIANT_SET_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.VARIANT_SET_UPDATED_TITLE)
     * t(notifications.VARIANT_SET_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.ADD_MIN_1_CHANGESET, NotificationType.WARNING],
    /**
     * t(notifications.ADD_MIN_1_CHANGESET_TITLE)
     * t(notifications.ADD_MIN_1_CHANGESET_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_EXPERIMENT_VARIANT_SET_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_EXPERIMENT_VARIANT_SET_SUCCESS_TITLE)
     * t(notifications.DELETE_EXPERIMENT_VARIANT_SET_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.PLATE_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.PLATE_ADDED_TITLE)
     * t(notifications.PLATE_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.PLATE_CONFIG_SAVED, NotificationType.SUCCESS],
    /**
     * t(notifications.PLATE_CONFIG_SAVED_TITLE)
     * t(notifications.PLATE_CONFIG_SAVED_MESSAGE)
     **/
    [NotificationIdentifier.PROJECT_MEMBER_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.PROJECT_MEMBER_ADDED_TITLE)
     * t(notifications.PROJECT_MEMBER_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_SET_MEMBER_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_SET_MEMBER_ADDED_TITLE)
     * t(notifications.EXPERIMENT_SET_MEMBER_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.PROJECT_MEMBER_ROLE_CHANGED, NotificationType.SUCCESS],
    /**
     * t(notifications.PROJECT_MEMBER_ROLE_CHANGED_TITLE)
     * t(notifications.PROJECT_MEMBER_ROLE_CHANGED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_SET_MEMBER_ROLE_CHANGED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_SET_MEMBER_ROLE_CHANGED_TITLE)
     * t(notifications.EXPERIMENT_SET_MEMBER_ROLE_CHANGED_MESSAGE)
     **/
    [NotificationIdentifier.PROJECT_MEMBER_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.PROJECT_MEMBER_DELETED_TITLE)
     * t(notifications.PROJECT_MEMBER_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_SET_MEMBER_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_SET_MEMBER_DELETED_TITLE)
     * t(notifications.EXPERIMENT_SET_MEMBER_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_START_CONDITION_SET, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_START_CONDITION_SET_TITLE)
     * t(notifications.EXPERIMENT_STEP_START_CONDITION_SET_MESSAGE)
     **/
    [NotificationIdentifier.TASK_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_CREATED_TITLE)
     * t(notifications.TASK_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.TASK_GENERAL_DATA_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_GENERAL_DATA_UPDATED_TITLE)
     * t(notifications.TASK_GENERAL_DATA_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.TASK_DUE_DATE_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_DUE_DATE_UPDATED_TITLE)
     * t(notifications.TASK_DUE_DATE_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.TASK_ACCEPTED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_ACCEPTED_TITLE)
     * t(notifications.TASK_ACCEPTED_MESSAGE)
     **/
    [NotificationIdentifier.TASK_ARCHIVED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_ARCHIVED_TITLE)
     * t(notifications.TASK_ARCHIVED_MESSAGE)
     **/
    [NotificationIdentifier.TASK_CANCELED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_CANCELED_TITLE)
     * t(notifications.TASK_CANCELED_MESSAGE)
     **/
    [NotificationIdentifier.TASK_REJECTED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_REJECTED_TITLE)
     * t(notifications.TASK_REJECTED_MESSAGE)
     **/
    [NotificationIdentifier.TASK_FINISHED, NotificationType.SUCCESS],
    /**
     * t(notifications.TASK_FINISHED_TITLE)
     * t(notifications.TASK_FINISHED_MESSAGE)
     **/
    [NotificationIdentifier.RESULTS_DRAFT_SAVED, NotificationType.SUCCESS],
    /**
     * t(notifications.RESULTS_DRAFT_SAVED_TITLE)
     * t(notifications.RESULTS_DRAFT_SAVED_MESSAGE)
     **/
    [NotificationIdentifier.RESULTS_FINALIZED, NotificationType.SUCCESS],
    /**
     * t(notifications.RESULTS_FINALIZED_TITLE)
     * t(notifications.RESULTS_FINALIZED_MESSAGE)
     **/
    [NotificationIdentifier.COMMENT_SET_FOR_ALL_FAILED_VARIANTS, NotificationType.SUCCESS],
    /**
     * t(notifications.COMMENT_SET_FOR_ALL_FAILED_VARIANTS_TITLE)
     * t(notifications.COMMENT_SET_FOR_ALL_FAILED_VARIANTS_MESSAGE)
     **/
    [NotificationIdentifier.ALL_VARIANTS_FOR_STEP_MARKED_AS_SUCCESSFUL, NotificationType.SUCCESS],
    /**
     * t(notifications.ALL_VARIANTS_FOR_STEP_MARKED_AS_SUCCESSFUL_TITLE)
     * t(notifications.ALL_VARIANTS_FOR_STEP_MARKED_AS_SUCCESSFUL_MESSAGE)
     **/
    [NotificationIdentifier.ALL_VARIANTS_FOR_STEP_MARKED_AS_FAILURE, NotificationType.SUCCESS],
    /**
     * t(notifications.ALL_VARIANTS_FOR_STEP_MARKED_AS_FAILURE_TITLE)
     * t(notifications.ALL_VARIANTS_FOR_STEP_MARKED_AS_FAILURE_MESSAGE)
     **/
    [NotificationIdentifier.FORM_INVALID, NotificationType.WARNING],
    /**
     * t(notifications.FORM_INVALID_TITLE)
     * t(notifications.FORM_INVALID_MESSAGE)
     **/
    [NotificationIdentifier.CUSTOMER_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CUSTOMER_CREATED_TITLE)
     * t(notifications.CUSTOMER_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.CUSTOMER_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CUSTOMER_UPDATED_TITLE)
     * t(notifications.CUSTOMER_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_CUSTOMER_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_CUSTOMER_SUCCESS_TITLE)
     * t(notifications.DELETE_CUSTOMER_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.COPY_TO_CLIPBOARD_FAILED, NotificationType.ERROR],
    /**
     * t(notifications.COPY_TO_CLIPBOARD_FAILED_TITLE)
     * t(notifications.COPY_TO_CLIPBOARD_FAILED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_MEASURAND_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_MEASURAND_SUCCESS_TITLE)
     * t(notifications.DELETE_MEASURAND_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.EDIT_MEASURAND_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.EDIT_MEASURAND_SUCCESS_TITLE)
     * t(notifications.EDIT_MEASURAND_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.EDIT_MEASURAND_SPECIALISATION_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.EDIT_MEASURAND_SPECIALISATION_SUCCESS_TITLE)
     * t(notifications.EDIT_MEASURAND_SPECIALISATION_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_MEASURAND_SPECIALISATION_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_MEASURAND_SPECIALISATION_SUCCESS_TITLE)
     * t(notifications.DELETE_MEASURAND_SPECIALISATION_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.POST_MEASURAND_SPECIALISATION_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.POST_MEASURAND_SPECIALISATION_SUCCESS_TITLE)
     * t(notifications.POST_MEASURAND_SPECIALISATION_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.MEASURAND_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.MEASURAND_CREATED_TITLE)
     * t(notifications.MEASURAND_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_SET_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_SET_CREATED_TITLE)
     * t(notifications.EXPERIMENT_STEP_SET_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.EXPERIMENT_STEP_SET_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.EXPERIMENT_STEP_SET_UPDATED_TITLE)
     * t(notifications.EXPERIMENT_STEP_SET_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_EXPERIMENT_STEP_SET_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_EXPERIMENT_STEP_SET_SUCCESS_TITLE)
     * t(notifications.DELETE_EXPERIMENT_STEP_SET_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_LIBRARY_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_LIBRARY_CREATED_TITLE)
     * t(notifications.CHEMICAL_LIBRARY_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.CHEMICAL_LIBRARY_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CHEMICAL_LIBRARY_UPDATED_TITLE)
     * t(notifications.CHEMICAL_LIBRARY_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_CHEMICAL_LIBRARY_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_CHEMICAL_LIBRARY_SUCCESS_TITLE)
     * t(notifications.DELETE_CHEMICAL_LIBRARY_SUCCESS_MESSAGE)
     **/
    [NotificationIdentifier.REACTION_KIT_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.REACTION_KIT_CREATED_TITLE)
     * t(notifications.REACTION_KIT_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.REACTION_KIT_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.REACTION_KIT_UPDATED_TITLE)
     * t(notifications.REACTION_KIT_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.DELETE_REACTION_KIT_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.DELETE_REACTION_KIT_SUCCESS_TITLE)
     * t(notifications.DELETE_REACTION_KIT_SUCCESS_MESSAGE)
     **/
  ]);

  constructor(private toastr: ToastrService,
              private translocoService: TranslocoService,
              private store: Store<AppState>) {
    this.store.pipe(select(selectIsMobile)).subscribe(isMobile => {
      this.isMobile = isMobile;
    });
  }

  /**
   * Pushes a toast notification: either immediately or in a deferred way if currently language files are loading.
   *
   * @param notificationIdentifier Identifier of the notification to push.
   * @param titleParams Translation params for the title string.
   * @param messageParams Translation params for the message string.
   */
  public toast(notificationIdentifier: NotificationIdentifier, titleParams: HashMap = {}, messageParams: HashMap = {}): void {
      this.doToast(notificationIdentifier, titleParams, messageParams);
  }

  /**
   * Pushes a success notification if the screen is big enough.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private success(title: any, content: any) {
    if (!this.isMobile) {
      this.toastr.success(content, title);
    }
  }

  /**
   * Pushes an error notification.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private error(title: any, content: any) {
    this.toastr.error(content, title);
  }

  /**
   * Pushes an info notification if the screen is big enough.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private info(title: any, content: any) {
    if (!this.isMobile) {
      this.toastr.info(content, title);
    }
  }

  /**
   * Pushes a warning notification.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private warning(title: any, content: any) {
    this.toastr.warning(content, title);
  }


  /**
   * Pushes a toast notification.
   *
   * @param notificationIdentifier Identifier of the notification to push.
   * @param titleParams Translation params for the title string.
   * @param messageParams Translation params for the message string.
   */
  private doToast(notificationIdentifier: NotificationIdentifier, titleParams: HashMap = {}, messageParams: HashMap = {}) {
    const title = this.translocoService.translate('notifications.' + notificationIdentifier.toString() + '_TITLE', titleParams);
    const message = this.translocoService.translate('notifications.' + notificationIdentifier.toString() + '_MESSAGE', messageParams);
    switch (this.notificationTypeMap.get(notificationIdentifier)) {
      case NotificationType.ERROR:
        this.error(title, message);
        break;
      case NotificationType.WARNING:
        this.warning(title, message);
        break;
      case NotificationType.SUCCESS:
        this.success(title, message);
        break;
      case NotificationType.INFO:
        this.info(title, message);
        break;
    }
  }

}
