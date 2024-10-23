import { User } from './user';

/**
 * Model of a login response from the server. Refresh token and account settings may be null for some routes.
 */
export class LoginResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;

  /**
   * Parses a login response object.
   *
   * @param payload LoginResponse json payload.
   * @return Parsed LoginResponse.
   */
  public static deserialize(payload: any): LoginResponse {
    const loginResponse = new LoginResponse();
    loginResponse.message = payload.message;
    loginResponse.user = User.deserialize(payload.user);
    loginResponse.accessToken = payload.accessToken;
    loginResponse.refreshToken = payload.refreshToken;
    return loginResponse;
  }
}
