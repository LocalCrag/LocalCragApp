import { User } from './user';

/**
 * Model of a login / session response from the server.
 */
export class LoginResponse {
  message: string;
  user: User;

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
    return loginResponse;
  }
}
