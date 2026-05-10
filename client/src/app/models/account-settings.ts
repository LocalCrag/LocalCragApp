import { LanguageCode } from '../utility/types/language';

export class AccountSettings {
  commentReplyMailsEnabled: boolean;
  reactionNotificationsEnabled: boolean;
  systemNotificationsEnabled: boolean;
  releaseNotesNotificationsEnabled: boolean;
  notificationDigestFrequency: 'daily' | 'weekly';
  language: LanguageCode;

  public static deserialize(payload: any): AccountSettings {
    const accountSettings = new AccountSettings();
    accountSettings.commentReplyMailsEnabled = payload.commentReplyMailsEnabled;
    accountSettings.reactionNotificationsEnabled =
      payload.reactionNotificationsEnabled;
    accountSettings.systemNotificationsEnabled =
      payload.systemNotificationsEnabled;
    accountSettings.releaseNotesNotificationsEnabled =
      payload.releaseNotesNotificationsEnabled ?? true;
    accountSettings.notificationDigestFrequency =
      payload.notificationDigestFrequency;
    accountSettings.language = payload.language;
    return accountSettings;
  }

  public static serialize(accountSettings: AccountSettings): any {
    return {
      commentReplyMailsEnabled: accountSettings.commentReplyMailsEnabled,
      reactionNotificationsEnabled:
        accountSettings.reactionNotificationsEnabled,
      systemNotificationsEnabled: accountSettings.systemNotificationsEnabled,
      releaseNotesNotificationsEnabled:
        accountSettings.releaseNotesNotificationsEnabled,
      notificationDigestFrequency: accountSettings.notificationDigestFrequency,
      language: accountSettings.language,
    };
  }
}
