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
    create: (regionId: string): string => `${this.apiHost}regions/${regionId}/crags`,
    getList: (): string => `${this.apiHost}crags`,
    getDetail: (id: string): string => `${this.apiHost}crags/${id}`,
    delete: (id: string): string => `${this.apiHost}crags/${id}`,
    update: (id: string): string => `${this.apiHost}crags/${id}`
  };

  public uploader = {
    uploadFile: (): string => `${this.apiHost}upload`
  };

  private apiHost = `${environment.apiHost}/api/`

}
