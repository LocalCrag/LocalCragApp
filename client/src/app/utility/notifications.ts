import { marker } from '@jsverse/transloco-keys-manager/marker';

/**
 * Possible types of a notification.
 */
export enum NotificationType {
  INFO,
  ERROR,
  WARNING,
  SUCCESS,
}

/**
 * Definition of a notification.
 */
export type NotificationDefinition = {
  type: NotificationType;
  title: string;
  message: string;
};

/**
 * All available notifications.
 */
export const NOTIFICATIONS = {
  MAP_MARKER_REMOVED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MAP_MARKER_REMOVED_TITLE'),
    message: marker('notifications.MAP_MARKER_REMOVED_MESSAGE'),
  },
  MAP_MARKER_ADDED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MAP_MARKER_ADDED_TITLE'),
    message: marker('notifications.MAP_MARKER_ADDED_MESSAGE'),
  },
  GALLERY_IMAGE_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.GALLERY_IMAGE_CREATED_TITLE'),
    message: marker('notifications.GALLERY_IMAGE_CREATED_MESSAGE'),
  },
  GALLERY_IMAGE_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.GALLERY_IMAGE_UPDATED_TITLE'),
    message: marker('notifications.GALLERY_IMAGE_UPDATED_MESSAGE'),
  },
  GALLERY_IMAGE_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.GALLERY_IMAGE_DELETED_TITLE'),
    message: marker('notifications.GALLERY_IMAGE_DELETED_MESSAGE'),
  },
  PROJECT_CLIMBED_MESSAGE_SENT: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.PROJECT_CLIMBED_MESSAGE_SENT_TITLE'),
    message: marker('notifications.PROJECT_CLIMBED_MESSAGE_SENT_MESSAGE'),
  },
  TODO_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.TODO_DELETED_TITLE'),
    message: marker('notifications.TODO_DELETED_MESSAGE'),
  },
  TODO_PRIORITY_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.TODO_PRIORITY_UPDATED_TITLE'),
    message: marker('notifications.TODO_PRIORITY_UPDATED_MESSAGE'),
  },
  TODO_ADD_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.TODO_ADD_ERROR_TITLE'),
    message: marker('notifications.TODO_ADD_ERROR_MESSAGE'),
  },
  TODO_ADDED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.TODO_ADDED_TITLE'),
    message: marker('notifications.TODO_ADDED_MESSAGE'),
  },
  ASCENT_ADDED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.ASCENT_ADDED_TITLE'),
    message: marker('notifications.ASCENT_ADDED_MESSAGE'),
  },
  ASCENT_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.ASCENT_UPDATED_TITLE'),
    message: marker('notifications.ASCENT_UPDATED_MESSAGE'),
  },
  ASCENT_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.ASCENT_DELETED_TITLE'),
    message: marker('notifications.ASCENT_DELETED_MESSAGE'),
  },
  ARCHIVED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.ARCHIVED_TITLE'),
    message: marker('notifications.ARCHIVED_MESSAGE'),
  },
  UNARCHIVED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.UNARCHIVED_TITLE'),
    message: marker('notifications.UNARCHIVED_MESSAGE'),
  },
  ARCHIVED_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.ARCHIVED_ERROR_TITLE'),
    message: marker('notifications.ARCHIVED_ERROR_MESSAGE'),
  },
  UNARCHIVED_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.UNARCHIVED_ERROR_TITLE'),
    message: marker('notifications.UNARCHIVED_ERROR_MESSAGE'),
  },
  LOGIN_ERROR: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.LOGIN_ERROR_TITLE'),
    message: marker('notifications.LOGIN_ERROR_MESSAGE'),
  },
  USER_PROMOTED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.USER_PROMOTED_TITLE'),
    message: marker('notifications.USER_PROMOTED_MESSAGE'),
  },
  USER_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.USER_DELETED_TITLE'),
    message: marker('notifications.USER_DELETED_MESSAGE'),
  },
  CREATE_USER_MAIL_SENT: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.CREATE_USER_MAIL_SENT_TITLE'),
    message: marker('notifications.CREATE_USER_MAIL_SENT_MESSAGE'),
  },
  ACCOUNT_SETTINGS_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.ACCOUNT_SETTINGS_UPDATED_TITLE'),
    message: marker('notifications.ACCOUNT_SETTINGS_UPDATED_MESSAGE'),
  },
  INSTANCE_SETTINGS_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.INSTANCE_SETTINGS_UPDATED_TITLE'),
    message: marker('notifications.INSTANCE_SETTINGS_UPDATED_MESSAGE'),
  },
  INSTANCE_SETTINGS_ERROR_MIGRATION_IMPOSSIBLE: {
    type: NotificationType.ERROR,
    title: marker(
      'notifications.INSTANCE_SETTINGS_ERROR_MIGRATION_IMPOSSIBLE_TITLE',
    ),
    message: marker(
      'notifications.INSTANCE_SETTINGS_ERROR_MIGRATION_IMPOSSIBLE_MESSAGE',
    ),
  },
  REGION_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.REGION_UPDATED_TITLE'),
    message: marker('notifications.REGION_UPDATED_MESSAGE'),
  },
  USER_NOT_ACTIVATED: {
    type: NotificationType.ERROR,
    title: marker('notifications.USER_NOT_ACTIVATED_TITLE'),
    message: marker('notifications.USER_NOT_ACTIVATED_MESSAGE'),
  },
  LOGIN_SUCCESS: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.LOGIN_SUCCESS_TITLE'),
    message: marker('notifications.LOGIN_SUCCESS_MESSAGE'),
  },
  CHANGE_PASSWORD_SUCCESS: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.CHANGE_PASSWORD_SUCCESS_TITLE'),
    message: marker('notifications.CHANGE_PASSWORD_SUCCESS_MESSAGE'),
  },
  FORGOT_PASSWORD_SUCCESS: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.FORGOT_PASSWORD_SUCCESS_TITLE'),
    message: marker('notifications.FORGOT_PASSWORD_SUCCESS_MESSAGE'),
  },
  RESET_PASSWORD_SUCCESS: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.RESET_PASSWORD_SUCCESS_TITLE'),
    message: marker('notifications.RESET_PASSWORD_SUCCESS_MESSAGE'),
  },
  COOKIES_ALLOWED: {
    type: NotificationType.INFO,
    title: marker('notifications.COOKIES_ALLOWED_TITLE'),
    message: marker('notifications.COOKIES_ALLOWED_MESSAGE'),
  },
  LOGOUT_SUCCESS: {
    type: NotificationType.INFO,
    title: marker('notifications.LOGOUT_SUCCESS_TITLE'),
    message: marker('notifications.LOGOUT_SUCCESS_MESSAGE'),
  },
  AUTO_LOGOUT_SUCCESS: {
    type: NotificationType.INFO,
    title: marker('notifications.AUTO_LOGOUT_SUCCESS_TITLE'),
    message: marker('notifications.AUTO_LOGOUT_SUCCESS_MESSAGE'),
  },
  UNKNOWN_AUTHENTICATION_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.UNKNOWN_AUTHENTICATION_ERROR_TITLE'),
    message: marker('notifications.UNKNOWN_AUTHENTICATION_ERROR_MESSAGE'),
  },
  UNKNOWN_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.UNKNOWN_ERROR_TITLE'),
    message: marker('notifications.UNKNOWN_ERROR_MESSAGE'),
  },
  LOG_OUT_TO_USE_THIS_FUNCTION: {
    type: NotificationType.INFO,
    title: marker('notifications.LOG_OUT_TO_USE_THIS_FUNCTION_TITLE'),
    message: marker('notifications.LOG_OUT_TO_USE_THIS_FUNCTION_MESSAGE'),
  },
  CRAG_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.CRAG_CREATED_TITLE'),
    message: marker('notifications.CRAG_CREATED_MESSAGE'),
  },
  CRAG_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.CRAG_UPDATED_TITLE'),
    message: marker('notifications.CRAG_UPDATED_MESSAGE'),
  },
  CRAG_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.CRAG_DELETED_TITLE'),
    message: marker('notifications.CRAG_DELETED_MESSAGE'),
  },
  SECTOR_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.SECTOR_CREATED_TITLE'),
    message: marker('notifications.SECTOR_CREATED_MESSAGE'),
  },
  SECTOR_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.SECTOR_UPDATED_TITLE'),
    message: marker('notifications.SECTOR_UPDATED_MESSAGE'),
  },
  SECTOR_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.SECTOR_DELETED_TITLE'),
    message: marker('notifications.SECTOR_DELETED_MESSAGE'),
  },
  AREA_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.AREA_CREATED_TITLE'),
    message: marker('notifications.AREA_CREATED_MESSAGE'),
  },
  AREA_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.AREA_UPDATED_TITLE'),
    message: marker('notifications.AREA_UPDATED_MESSAGE'),
  },
  AREA_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.AREA_DELETED_TITLE'),
    message: marker('notifications.AREA_DELETED_MESSAGE'),
  },
  LINE_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.LINE_CREATED_TITLE'),
    message: marker('notifications.LINE_CREATED_MESSAGE'),
  },
  LINE_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.LINE_UPDATED_TITLE'),
    message: marker('notifications.LINE_UPDATED_MESSAGE'),
  },
  LINE_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.LINE_DELETED_TITLE'),
    message: marker('notifications.LINE_DELETED_MESSAGE'),
  },
  POST_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.POST_CREATED_TITLE'),
    message: marker('notifications.POST_CREATED_MESSAGE'),
  },
  POST_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.POST_UPDATED_TITLE'),
    message: marker('notifications.POST_UPDATED_MESSAGE'),
  },
  POST_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.POST_DELETED_TITLE'),
    message: marker('notifications.POST_DELETED_MESSAGE'),
  },
  TOPO_IMAGE_ADDED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.TOPO_IMAGE_ADDED_TITLE'),
    message: marker('notifications.TOPO_IMAGE_ADDED_MESSAGE'),
  },
  TOPO_IMAGE_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.TOPO_IMAGE_UPDATED_TITLE'),
    message: marker('notifications.TOPO_IMAGE_UPDATED_MESSAGE'),
  },
  TOPO_IMAGE_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.TOPO_IMAGE_DELETED_TITLE'),
    message: marker('notifications.TOPO_IMAGE_DELETED_MESSAGE'),
  },
  LINE_PATH_ADDED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.LINE_PATH_ADDED_TITLE'),
    message: marker('notifications.LINE_PATH_ADDED_MESSAGE'),
  },
  LINE_PATH_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.LINE_PATH_DELETED_TITLE'),
    message: marker('notifications.LINE_PATH_DELETED_MESSAGE'),
  },
  MENU_PAGE_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MENU_PAGE_DELETED_TITLE'),
    message: marker('notifications.MENU_PAGE_DELETED_MESSAGE'),
  },
  MENU_PAGE_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MENU_PAGE_UPDATED_TITLE'),
    message: marker('notifications.MENU_PAGE_UPDATED_MESSAGE'),
  },
  MENU_PAGE_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MENU_PAGE_CREATED_TITLE'),
    message: marker('notifications.MENU_PAGE_CREATED_MESSAGE'),
  },
  MENU_ITEM_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MENU_ITEM_DELETED_TITLE'),
    message: marker('notifications.MENU_ITEM_DELETED_MESSAGE'),
  },
  MENU_ITEM_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MENU_ITEM_UPDATED_TITLE'),
    message: marker('notifications.MENU_ITEM_UPDATED_MESSAGE'),
  },
  MENU_ITEM_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.MENU_ITEM_CREATED_TITLE'),
    message: marker('notifications.MENU_ITEM_CREATED_MESSAGE'),
  },
  USER_REGISTERED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.USER_REGISTERED_TITLE'),
    message: marker('notifications.USER_REGISTERED_MESSAGE'),
  },
  SCALE_CREATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.SCALE_CREATED_TITLE'),
    message: marker('notifications.SCALE_CREATED_MESSAGE'),
  },
  SCALE_CREATED_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.SCALE_CREATED_ERROR_TITLE'),
    message: marker('notifications.SCALE_CREATED_ERROR_MESSAGE'),
  },
  SCALE_UPDATED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.SCALE_UPDATED_TITLE'),
    message: marker('notifications.SCALE_UPDATED_MESSAGE'),
  },
  SCALE_UPDATED_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.SCALE_UPDATED_ERROR_TITLE'),
    message: marker('notifications.SCALE_UPDATED_ERROR_MESSAGE'),
  },
  SCALE_DELETED: {
    type: NotificationType.SUCCESS,
    title: marker('notifications.SCALE_DELETED_TITLE'),
    message: marker('notifications.SCALE_DELETED_MESSAGE'),
  },
  SCALE_DELETED_ERROR: {
    type: NotificationType.ERROR,
    title: marker('notifications.SCALE_DELETED_ERROR_TITLE'),
    message: marker('notifications.SCALE_DELETED_ERROR_MESSAGE'),
  },
} satisfies { [key: string]: NotificationDefinition };

export type NotificationKey = keyof typeof NOTIFICATIONS;

/**
 * Get a notification by key. In contrast to directly accessing the NOTIFICATIONS object, this function
 * will throw an error if the key does not exist.
 * @param key Key of the notification to get.
 */
export const getNotification = (
  key: NotificationKey,
): NotificationDefinition => {
  return NOTIFICATIONS[key];
};
