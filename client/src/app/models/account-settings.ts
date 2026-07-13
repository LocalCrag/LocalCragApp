import { LanguageCode } from '../utility/types/language';
import { ColorScheme } from '../services/core/theme.service';

export class AccountSettings {
  commentReplyMailsEnabled: boolean;
  reactionNotificationsEnabled: boolean;
  systemNotificationsEnabled: boolean;
  moderatorTaskNotificationsEnabled: boolean;
  notificationDigestFrequency: 'daily' | 'weekly';
  language: LanguageCode;
  colorScheme: ColorScheme;

  public static deserialize(payload: any): AccountSettings {
    const accountSettings = new AccountSettings();
    accountSettings.commentReplyMailsEnabled = payload.commentReplyMailsEnabled;
    accountSettings.reactionNotificationsEnabled =
      payload.reactionNotificationsEnabled;
    accountSettings.systemNotificationsEnabled =
      payload.systemNotificationsEnabled;
    accountSettings.moderatorTaskNotificationsEnabled =
      payload.moderatorTaskNotificationsEnabled;
    accountSettings.notificationDigestFrequency =
      payload.notificationDigestFrequency;
    accountSettings.language = payload.language;
    accountSettings.colorScheme = payload.colorScheme ?? 'system';
    return accountSettings;
  }

  public static serialize(accountSettings: AccountSettings): any {
    return {
      commentReplyMailsEnabled: accountSettings.commentReplyMailsEnabled,
      reactionNotificationsEnabled:
        accountSettings.reactionNotificationsEnabled,
      systemNotificationsEnabled: accountSettings.systemNotificationsEnabled,
      moderatorTaskNotificationsEnabled:
        accountSettings.moderatorTaskNotificationsEnabled,
      notificationDigestFrequency: accountSettings.notificationDigestFrequency,
      language: accountSettings.language,
      colorScheme: accountSettings.colorScheme,
    };
  }
}
