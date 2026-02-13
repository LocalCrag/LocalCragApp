import { LanguageCode } from '../utility/types/language';

export class AccountSettings {
  commentReplyMailsEnabled: boolean;
  language: LanguageCode;

  public static deserialize(payload: any): AccountSettings {
    const accountSettings = new AccountSettings();
    accountSettings.commentReplyMailsEnabled = payload.commentReplyMailsEnabled;
    accountSettings.language = payload.language;
    return accountSettings;
  }

  public static serialize(accountSettings: AccountSettings): any {
    return {
      commentReplyMailsEnabled: accountSettings.commentReplyMailsEnabled,
      language: accountSettings.language,
    };
  }
}
