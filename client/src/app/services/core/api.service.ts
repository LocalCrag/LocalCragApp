import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { LineType } from '../../enums/line-type';

/**
 * Simple container service holding api route definitions.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  public auth = {
    login: (): string => `${this.apiHost}login`,
    loginRefresh: (): string => `${this.apiHost}token/refresh`,
    logoutAccess: (): string => `${this.apiHost}logout/access`,
    logoutRefresh: (): string => `${this.apiHost}logout/refresh`,
    forgotPassword: (): string => `${this.apiHost}forgot-password`,
    resetPassword: (): string => `${this.apiHost}reset-password`,
    changePassword: (): string => `${this.apiHost}change-password`,
  };

  public instanceSettings = {
    getDetail: (): string => `${this.apiHost}instance-settings`,
    update: (): string => `${this.apiHost}instance-settings`,
  };

  public account = {
    update: (): string => `${this.apiHost}account`,
    changeEmail: (): string => `${this.apiHost}account/change-email`,
    deleteOwnUser: (): string => `${this.apiHost}account/delete-own-user`,
    getSettings: (): string => `${this.apiHost}account/settings`,
    updateSettings: (): string => `${this.apiHost}account/settings`,
    getRecentSearches: (): string => `${this.apiHost}account/recent-searches`,
    createRecentSearch: (): string => `${this.apiHost}account/recent-searches`,
    getNotifications: (): string => `${this.apiHost}account/notifications`,
    getNotificationsCount: (): string =>
      `${this.apiHost}account/notifications/count`,
    dismissNotification: (id: string): string =>
      `${this.apiHost}account/notifications/${id}/dismiss`,
    dismissAllNotifications: (): string =>
      `${this.apiHost}account/notifications/dismiss-all`,
    releaseNoteBundle: (bundleId: string): string =>
      `${this.apiHost}account/release-notes/${bundleId}`,
  };

  public statistics = {
    completion: (): string => `${this.apiHost}statistics/completion`,
    instance: (): string => `${this.apiHost}statistics/instance`,
  };

  public search = {
    search: (query: string): string => `${this.apiHost}search/${query}`,
  };

  public history = {
    getList: (): string => `${this.apiHost}history`,
  };

  public maps = {
    getMarkers: (): string => `${this.apiHost}maps/markers`,
  };

  public blocweather = {
    getNearest: (level: string, slug: string): string =>
      `${this.apiHost}blocweather/nearest/${level}/${slug}`,
  };

  public gallery = {
    getDetail: (id: string): string => `${this.apiHost}gallery/${id}`,
    create: (): string => `${this.apiHost}gallery`,
    update: (id: string): string => `${this.apiHost}gallery/${id}`,
    delete: (id: string): string => `${this.apiHost}gallery/${id}`,
    getList: (): string => `${this.apiHost}gallery`,
  };

  public ticks = {
    getList: (): string => `${this.apiHost}ticks`,
  };

  public isTodo = {
    getList: (): string => `${this.apiHost}is-todo`,
  };

  public archive = {
    setArchived: (): string => `${this.apiHost}archive`,
  };

  public users = {
    register: (): string => `${this.apiHost}users`,
    getList: (): string => `${this.apiHost}users`,
    getDetail: (slug: string): string => `${this.apiHost}users/${slug}`,
    resendUserCreateMail: (id: string): string =>
      `${this.apiHost}users/${id}/resend-user-create-mail`,
    delete: (id: string): string => `${this.apiHost}users/${id}`,
    promoteUser: (id: string): string => `${this.apiHost}users/${id}/promote`,
    getEmailTaken: (email: string): string =>
      `${this.apiHost}users/email-taken/${email}`,
    getGrades: (slug: string): string => `${this.apiHost}users/${slug}/grades`,
    getStatistics: (slug: string): string =>
      `${this.apiHost}users/${slug}/statistics`,
  };

  public moderatorTasks = {
    getList: (): string => `${this.apiHost}moderator-tasks`,
    getDetail: (id: string): string => `${this.apiHost}moderator-tasks/${id}`,
    create: (): string => `${this.apiHost}moderator-tasks`,
    update: (id: string): string => `${this.apiHost}moderator-tasks/${id}`,
    delete: (id: string): string => `${this.apiHost}moderator-tasks/${id}`,
    toggleComplete: (id: string): string =>
      `${this.apiHost}moderator-tasks/${id}/toggle-complete`,
  };

  public todos = {
    create: (): string => `${this.apiHost}todos`,
    getList: (): string => `${this.apiHost}todos`,
    delete: (id: string): string => `${this.apiHost}todos/${id}`,
    updatePriority: (id: string): string =>
      `${this.apiHost}todos/${id}/update-priority`,
  };

  public posts = {
    create: (): string => `${this.apiHost}posts`,
    getList: (): string => `${this.apiHost}posts`,
    getDetail: (slug: string): string => `${this.apiHost}posts/${slug}`,
    delete: (slug: string): string => `${this.apiHost}posts/${slug}`,
    update: (slug: string): string => `${this.apiHost}posts/${slug}`,
  };

  public menuPages = {
    create: (): string => `${this.apiHost}menu-pages`,
    getList: (): string => `${this.apiHost}menu-pages`,
    getDetail: (slug: string): string => `${this.apiHost}menu-pages/${slug}`,
    delete: (slug: string): string => `${this.apiHost}menu-pages/${slug}`,
    update: (slug: string): string => `${this.apiHost}menu-pages/${slug}`,
  };

  public menuItems = {
    create: (): string => `${this.apiHost}menu-items`,
    getList: (): string => `${this.apiHost}menu-items`,
    getDetail: (id: string): string => `${this.apiHost}menu-items/${id}`,
    delete: (id: string): string => `${this.apiHost}menu-items/${id}`,
    update: (id: string): string => `${this.apiHost}menu-items/${id}`,
    updateOrderTop: (): string => `${this.apiHost}menu-items/update-order-top`,
    updateOrderBottom: (): string =>
      `${this.apiHost}menu-items/update-order-bottom`,
    getCragMenuStructure: (): string =>
      `${this.apiHost}menu-items/crag-menu-structure`,
  };

  public region = {
    getDetail: (): string => `${this.apiHost}region`,
    update: (): string => `${this.apiHost}region`,
    getGrades: (): string => `${this.apiHost}region/grades`,
  };

  public crags = {
    create: (): string => `${this.apiHost}crags`,
    getList: (): string => `${this.apiHost}crags`,
    getDetail: (slug: string): string => `${this.apiHost}crags/${slug}`,
    getClosureState: (slug: string): string =>
      `${this.apiHost}crags/${slug}/closure-state`,
    delete: (slug: string): string => `${this.apiHost}crags/${slug}`,
    update: (slug: string): string => `${this.apiHost}crags/${slug}`,
    getGrades: (slug: string): string => `${this.apiHost}crags/${slug}/grades`,
    updateOrder: (): string => `${this.apiHost}crags/update-order`,
    findByName: (): string => `${this.apiHost}crags/find-by-name`,
  };

  public sectors = {
    create: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/sectors`,
    getList: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/sectors`,
    getDetail: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    getClosureState: (slug: string): string =>
      `${this.apiHost}sectors/${slug}/closure-state`,
    delete: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    update: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    getGrades: (slug: string): string =>
      `${this.apiHost}sectors/${slug}/grades`,
    updateOrder: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/sectors/update-order`,
    getSeason: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/season`,
    move: (slug: string): string => `${this.apiHost}sectors/${slug}/move`,
    findByName: (): string => `${this.apiHost}sectors/find-by-name`,
  };

  public areas = {
    create: (sectorSlug: string): string =>
      `${this.apiHost}sectors/${sectorSlug}/areas`,
    getList: (sectorSlug: string): string =>
      `${this.apiHost}sectors/${sectorSlug}/areas`,
    getDetail: (slug: string): string => `${this.apiHost}areas/${slug}`,
    getClosureState: (slug: string): string =>
      `${this.apiHost}areas/${slug}/closure-state`,
    delete: (slug: string): string => `${this.apiHost}areas/${slug}`,
    update: (slug: string): string => `${this.apiHost}areas/${slug}`,
    getGrades: (slug: string): string => `${this.apiHost}areas/${slug}/grades`,
    updateOrder: (sectorSlug: string): string =>
      `${this.apiHost}sectors/${sectorSlug}/areas/update-order`,
    batchCreate: (slug: string): string =>
      `${this.apiHost}areas/${slug}/batch-create`,
    move: (slug: string): string => `${this.apiHost}areas/${slug}/move`,
    findByName: (): string => `${this.apiHost}areas/find-by-name`,
  };

  public ascents = {
    create: (): string => `${this.apiHost}ascents`,
    update: (id: string): string => `${this.apiHost}ascents/${id}`,
    clearFa: (id: string): string => `${this.apiHost}ascents/${id}/clear-fa`,
    delete: (id: string): string => `${this.apiHost}ascents/${id}`,
    getList: (): string => `${this.apiHost}ascents`,
    sendProjectClimbedMessage: (): string =>
      `${this.apiHost}ascents/send-project-climbed-message`,
  };

  public ranking = {
    getList: (): string => `${this.apiHost}ranking`,
  };

  public topoImages = {
    add: (areaSlug: string): string =>
      `${this.apiHost}areas/${areaSlug}/topo-images`,
    getList: (areaSlug: string): string =>
      `${this.apiHost}areas/${areaSlug}/topo-images`,
    getDetail: (id: string): string => `${this.apiHost}topo-images/${id}`,
    delete: (id: string): string => `${this.apiHost}topo-images/${id}`,
    update: (id: string): string => `${this.apiHost}topo-images/${id}`,
    updateOrder: (areaSlug: string): string =>
      `${this.apiHost}areas/${areaSlug}/topo-images/update-order`,
    move: (id: string): string => `${this.apiHost}topo-images/${id}/move`,
  };

  public linePaths = {
    addLinePath: (topoImageId: string): string =>
      `${this.apiHost}topo-images/${topoImageId}/line-paths`,
    updateOrder: (topoImageId: string): string =>
      `${this.apiHost}topo-images/${topoImageId}/line-paths/update-order`,
    updateOrderForLines: (lineSlug: string): string =>
      `${this.apiHost}lines/${lineSlug}/line-paths/update-order`,
    delete: (id: string): string => `${this.apiHost}line-paths/${id}`,
  };

  public lines = {
    create: (areaSlug: string): string =>
      `${this.apiHost}areas/${areaSlug}/lines`,
    getList: (): string => `${this.apiHost}lines`,
    getListForLineEditor: (areaSlug: string): string =>
      `${this.apiHost}lines/for-line-editor/${areaSlug}`,
    getDetail: (slug: string): string => `${this.apiHost}lines/${slug}`,
    getClosureState: (slug: string): string =>
      `${this.apiHost}lines/${slug}/closure-state`,
    delete: (slug: string): string => `${this.apiHost}lines/${slug}`,
    update: (slug: string): string => `${this.apiHost}lines/${slug}`,
    move: (id: string): string => `${this.apiHost}lines/${id}/move`,
    findByName: (): string => `${this.apiHost}lines/find-by-name`,
  };

  public uploader = {
    uploadFile: (): string => `${this.apiHost}upload`,
  };

  public files = {
    update: (id: string): string => `${this.apiHost}files/${id}`,
  };

  public scales = {
    get: (lineType: LineType, name: string) =>
      `${this.apiHost}scales/${lineType}/${name}`,
    getList: () => `${this.apiHost}scales`,
    create: () => `${this.apiHost}scales`,
    update: (lineType: LineType, name: string) =>
      `${this.apiHost}scales/${lineType}/${name}`,
    delete: (lineType: LineType, name: string) =>
      `${this.apiHost}scales/${lineType}/${name}`,
  };

  // Comments API
  public comments = {
    getList: (): string => `${this.apiHost}comments`,
    create: (): string => `${this.apiHost}comments`,
    update: (id: string): string => `${this.apiHost}comments/${id}`,
    delete: (id: string): string => `${this.apiHost}comments/${id}`,
  };

  // Reactions API
  public reactions = {
    create: (targetType: string, targetId: string): string =>
      `${this.apiHost}reactions/${targetType}/${targetId}`,
    update: (targetType: string, targetId: string): string =>
      `${this.apiHost}reactions/${targetType}/${targetId}`,
    delete: (targetType: string, targetId: string): string =>
      `${this.apiHost}reactions/${targetType}/${targetId}`,
  };

  private apiHost = `${environment.apiHost}/api/`;
}
