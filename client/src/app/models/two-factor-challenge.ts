import { LoginResponse } from './login-response';

/**
 * Returned after a correct password when a second factor is still required.
 */
export interface TwoFactorChallenge {
  message: 'LOGIN_TWO_FACTOR_REQUIRED';
  challengeToken: string;
  totpEnabled: boolean;
  emailTwoFactorEnabled: boolean;
  emailSent: boolean;
}

export type PasswordAuthResult = LoginResponse | TwoFactorChallenge;

export function isTwoFactorChallenge(
  result: PasswordAuthResult,
): result is TwoFactorChallenge {
  return result.message === 'LOGIN_TWO_FACTOR_REQUIRED';
}

export function deserializePasswordAuth(payload: any): PasswordAuthResult {
  if (payload?.message === 'LOGIN_TWO_FACTOR_REQUIRED') {
    return {
      message: 'LOGIN_TWO_FACTOR_REQUIRED',
      challengeToken: payload.challengeToken,
      totpEnabled: payload.totpEnabled === true,
      emailTwoFactorEnabled: payload.emailTwoFactorEnabled === true,
      emailSent: payload.emailSent === true,
    };
  }
  return LoginResponse.deserialize(payload);
}
