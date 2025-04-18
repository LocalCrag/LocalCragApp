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

  public statistics = {
    completion: (query: string): string =>
      `${this.apiHost}statistics/completion${query}`,
  };

  public search = {
    search: (query: string): string => `${this.apiHost}search/${query}`,
  };

  public history = {
    getList: (filters: string): string => `${this.apiHost}history${filters}`,
  };

  public maps = {
    getMarkers: (filters: string): string =>
      `${this.apiHost}maps/markers${filters}`,
  };

  public gallery = {
    getDetail: (id: string): string => `${this.apiHost}gallery/${id}`,
    create: (): string => `${this.apiHost}gallery`,
    update: (id: string): string => `${this.apiHost}gallery/${id}`,
    delete: (id: string): string => `${this.apiHost}gallery/${id}`,
    getList: (filters: string): string => `${this.apiHost}gallery${filters}`,
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
    updateAccount: (): string => `${this.apiHost}users/account`,
    resendUserCreateMail: (id: string): string =>
      `${this.apiHost}users/${id}/resend-user-create-mail`,
    delete: (id: string): string => `${this.apiHost}users/${id}`,
    promoteUser: (id: string): string => `${this.apiHost}users/${id}/promote`,
    changeEmail: (): string => `${this.apiHost}users/account/change-email`,
    getEmailTaken: (email: string): string =>
      `${this.apiHost}users/email-taken/${email}`,
    getGrades: (slug: string): string => `${this.apiHost}users/${slug}/grades`,
  };

  public todos = {
    create: (): string => `${this.apiHost}todos`,
    getList: (filters: string): string => `${this.apiHost}todos${filters}`,
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
    delete: (slug: string): string => `${this.apiHost}crags/${slug}`,
    update: (slug: string): string => `${this.apiHost}crags/${slug}`,
    getGrades: (slug: string): string => `${this.apiHost}crags/${slug}/grades`,
    updateOrder: (): string => `${this.apiHost}crags/update-order`,
  };

  public sectors = {
    create: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/sectors`,
    getList: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/sectors`,
    getDetail: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    delete: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    update: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    getGrades: (slug: string): string =>
      `${this.apiHost}sectors/${slug}/grades`,
    updateOrder: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/sectors/update-order`,
    getSeason: (cragSlug: string): string =>
      `${this.apiHost}crags/${cragSlug}/season`,
  };

  public areas = {
    create: (sectorSlug: string): string =>
      `${this.apiHost}sectors/${sectorSlug}/areas`,
    getList: (sectorSlug: string): string =>
      `${this.apiHost}sectors/${sectorSlug}/areas`,
    getDetail: (slug: string): string => `${this.apiHost}areas/${slug}`,
    delete: (slug: string): string => `${this.apiHost}areas/${slug}`,
    update: (slug: string): string => `${this.apiHost}areas/${slug}`,
    getGrades: (slug: string): string => `${this.apiHost}areas/${slug}/grades`,
    updateOrder: (sectorSlug: string): string =>
      `${this.apiHost}sectors/${sectorSlug}/areas/update-order`,
  };

  public ascents = {
    create: (): string => `${this.apiHost}ascents`,
    update: (id: string): string => `${this.apiHost}ascents/${id}`,
    delete: (id: string): string => `${this.apiHost}ascents/${id}`,
    getList: (filters: string): string => `${this.apiHost}ascents${filters}`,
    sendProjectClimbedMessage: (): string =>
      `${this.apiHost}ascents/send-project-climbed-message`,
  };

  public ranking = {
    getList: (filters: string): string => `${this.apiHost}ranking${filters}`,
  };

  public topoImages = {
    add: (areaSlug: string): string =>
      `${this.apiHost}areas/${areaSlug}/topo-images`,
    getList: (areaSlug: string, filters?: string): string =>
      `${this.apiHost}areas/${areaSlug}/topo-images${filters ?? ''}`,
    getDetail: (id: string): string => `${this.apiHost}topo-images/${id}`,
    delete: (id: string): string => `${this.apiHost}topo-images/${id}`,
    update: (id: string): string => `${this.apiHost}topo-images/${id}`,
    updateOrder: (areaSlug: string): string =>
      `${this.apiHost}areas/${areaSlug}/topo-images/update-order`,
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
    getList: (filters: string): string => `${this.apiHost}lines${filters}`,
    getListForLineEditor: (areaSlug: string): string =>
      `${this.apiHost}lines/for-line-editor/${areaSlug}`,
    getDetail: (slug: string): string => `${this.apiHost}lines/${slug}`,
    delete: (slug: string): string => `${this.apiHost}lines/${slug}`,
    update: (slug: string): string => `${this.apiHost}lines/${slug}`,
  };

  public uploader = {
    uploadFile: (): string => `${this.apiHost}upload`,
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

  private apiHost = `${environment.apiHost}/api/`;
}
