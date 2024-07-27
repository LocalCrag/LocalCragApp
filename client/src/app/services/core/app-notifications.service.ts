import {Injectable, NgZone} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {NotificationType} from '../../utility/notifications/notification-type.enum';
import {HashMap, TranslocoService} from '@ngneat/transloco';
import {NotificationIdentifier} from '../../utility/notifications/notification-identifier.enum';
import {AppState} from '../../ngrx/reducers';
import {selectIsMobile} from '../../ngrx/selectors/device.selectors';
import {MessageService} from 'primeng/api';

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
    [NotificationIdentifier.TODO_ADD_ERROR, NotificationType.ERROR],
    /**
     * t(notifications.TODO_ADD_ERROR_TITLE)
     * t(notifications.TODO_ADD_ERROR_MESSAGE)
     **/
    [NotificationIdentifier.TODO_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.TODO_DELETED_TITLE)
     * t(notifications.TODO_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.TODO_PRIORITY_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.TODO_PRIORITY_UPDATED_TITLE)
     * t(notifications.TODO_PRIORITY_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.TODO_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.TODO_ADDED_TITLE)
     * t(notifications.TODO_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.LINE_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.LINE_UPDATED_TITLE)
     * t(notifications.LINE_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.ASCENT_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.ASCENT_DELETED_TITLE)
     * t(notifications.ASCENT_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.ASCENT_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.ASCENT_ADDED_TITLE)
     * t(notifications.ASCENT_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.ASCENT_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.ASCENT_UPDATED_TITLE)
     * t(notifications.ASCENT_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.LOGIN_ERROR, NotificationType.ERROR],
    /**
     * t(notifications.LOGIN_ERROR_TITLE)
     * t(notifications.LOGIN_ERROR_MESSAGE)
     **/
    [NotificationIdentifier.USER_PROMOTED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_PROMOTED_TITLE)
     * t(notifications.USER_PROMOTED_MESSAGE)
     **/
    [NotificationIdentifier.USER_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_DELETED_TITLE)
     * t(notifications.USER_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.CREATE_USER_MAIL_SENT, NotificationType.SUCCESS],
    /**
     * t(notifications.CREATE_USER_MAIL_SENT_TITLE)
     * t(notifications.CREATE_USER_MAIL_SENT_MESSAGE)
     **/
    [NotificationIdentifier.ACCOUNT_SETTINGS_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.ACCOUNT_SETTINGS_UPDATED_TITLE)
     * t(notifications.ACCOUNT_SETTINGS_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.USER_REGISTERED, NotificationType.SUCCESS],
    /**
     * t(notifications.USER_REGISTERED_TITLE)
     * t(notifications.USER_REGISTERED_MESSAGE)
     **/
    [NotificationIdentifier.INSTANCE_SETTINGS_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.INSTANCE_SETTINGS_UPDATED_TITLE)
     * t(notifications.INSTANCE_SETTINGS_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.MENU_ITEM_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.MENU_ITEM_DELETED_TITLE)
     * t(notifications.MENU_ITEM_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.MENU_ITEM_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.MENU_ITEM_CREATED_TITLE)
     * t(notifications.MENU_ITEM_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.MENU_ITEM_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.MENU_ITEM_UPDATED_TITLE)
     * t(notifications.MENU_ITEM_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.MENU_PAGE_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.MENU_PAGE_DELETED_TITLE)
     * t(notifications.MENU_PAGE_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.MENU_PAGE_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.MENU_PAGE_CREATED_TITLE)
     * t(notifications.MENU_PAGE_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.MENU_PAGE_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.MENU_PAGE_UPDATED_TITLE)
     * t(notifications.MENU_PAGE_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.TOPO_IMAGE_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.TOPO_IMAGE_UPDATED_TITLE)
     * t(notifications.TOPO_IMAGE_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.REGION_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.REGION_UPDATED_TITLE)
     * t(notifications.REGION_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.POST_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.POST_DELETED_TITLE)
     * t(notifications.POST_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.POST_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.POST_UPDATED_TITLE)
     * t(notifications.POST_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.POST_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.POST_CREATED_TITLE)
     * t(notifications.POST_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.LINE_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.LINE_CREATED_TITLE)
     * t(notifications.LINE_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.LINE_PATH_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.LINE_PATH_DELETED_TITLE)
     * t(notifications.LINE_PATH_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.LINE_PATH_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.LINE_PATH_ADDED_TITLE)
     * t(notifications.LINE_PATH_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.TOPO_IMAGE_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.TOPO_IMAGE_DELETED_TITLE)
     * t(notifications.TOPO_IMAGE_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.TOPO_IMAGE_ADDED, NotificationType.SUCCESS],
    /**
     * t(notifications.TOPO_IMAGE_ADDED_TITLE)
     * t(notifications.TOPO_IMAGE_ADDED_MESSAGE)
     **/
    [NotificationIdentifier.AREA_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.AREA_DELETED_TITLE)
     * t(notifications.AREA_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.AREA_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.AREA_UPDATED_TITLE)
     * t(notifications.AREA_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.AREA_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.AREA_CREATED_TITLE)
     * t(notifications.AREA_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.SECTOR_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.SECTOR_DELETED_TITLE)
     * t(notifications.SECTOR_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.SECTOR_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.SECTOR_UPDATED_TITLE)
     * t(notifications.SECTOR_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.SECTOR_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.SECTOR_CREATED_TITLE)
     * t(notifications.SECTOR_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.CRAG_DELETED, NotificationType.SUCCESS],
    /**
     * t(notifications.CRAG_DELETED_TITLE)
     * t(notifications.CRAG_DELETED_MESSAGE)
     **/
    [NotificationIdentifier.CRAG_UPDATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CRAG_UPDATED_TITLE)
     * t(notifications.CRAG_UPDATED_MESSAGE)
     **/
    [NotificationIdentifier.CRAG_CREATED, NotificationType.SUCCESS],
    /**
     * t(notifications.CRAG_CREATED_TITLE)
     * t(notifications.CRAG_CREATED_MESSAGE)
     **/
    [NotificationIdentifier.USER_NOT_ACTIVATED, NotificationType.ERROR],
    /**
     * t(notifications.USER_NOT_ACTIVATED_TITLE)
     * t(notifications.USER_NOT_ACTIVATED_MESSAGE)
     **/
    [NotificationIdentifier.LOGIN_SUCCESS, NotificationType.SUCCESS],
    /**
     * t(notifications.LOGIN_SUCCESS_TITLE)
     * t(notifications.LOGIN_SUCCESS_MESSAGE)
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
    [NotificationIdentifier.LOG_OUT_TO_USE_THIS_FUNCTION, NotificationType.INFO],
    /**
     * t(notifications.LOG_OUT_TO_USE_THIS_FUNCTION_TITLE)
     * t(notifications.LOG_OUT_TO_USE_THIS_FUNCTION_MESSAGE)
     **/
  ]);

  constructor(private messageService: MessageService,
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
        this.messageService.add({severity: 'success', detail: content, summary: title, life: 5000});
      }
  }

  /**
   * Pushes an error notification.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private error(title: any, content: any) {
    this.messageService.add({severity: 'error', detail: content, summary: title, life: 5000});
  }

  /**
   * Pushes an info notification if the screen is big enough.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private info(title: any, content: any) {
    if (!this.isMobile) {
      this.messageService.add({severity: 'info', detail: content, summary: title, life: 5000});
    }
  }

  /**
   * Pushes a warning notification.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private warning(title: any, content: any) {
    this.messageService.add({severity: 'warn', detail: content, summary: title, life: 5000});
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
