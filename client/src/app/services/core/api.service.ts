import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';

/**
 * Simple container service holding api route definitions.
 */
@Injectable({
  providedIn: 'root'
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

  public crags = {
    create: (regionSlug: string): string => `${this.apiHost}regions/${regionSlug}/crags`,
    getList: (regionSlug: string): string => `${this.apiHost}regions/${regionSlug}/crags`,
    getDetail: (slug: string): string => `${this.apiHost}crags/${slug}`,
    delete: (slug: string): string => `${this.apiHost}crags/${slug}`,
    update: (slug: string): string => `${this.apiHost}crags/${slug}`
  };

  public sectors = {
    create: (cragSlug: string): string => `${this.apiHost}crags/${cragSlug}/sectors`,
    getList: (cragSlug: string): string => `${this.apiHost}crags/${cragSlug}/sectors`,
    getDetail: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    delete: (slug: string): string => `${this.apiHost}sectors/${slug}`,
    update: (slug: string): string => `${this.apiHost}sectors/${slug}`
  };

  public uploader = {
    uploadFile: (): string => `${this.apiHost}upload`
  };

  private apiHost = `${environment.apiHost}/api/`

}
