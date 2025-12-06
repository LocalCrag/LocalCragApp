export class AccountSettings {
  commentReplyMailsEnabled: boolean;

  public static deserialize(payload: any): AccountSettings {
    const accountSettings = new AccountSettings();
    accountSettings.commentReplyMailsEnabled = payload.commentReplyMailsEnabled;
    return accountSettings;
  }

  public static serialize(accountSettings: AccountSettings): any {
    return {
      commentReplyMailsEnabled: accountSettings.commentReplyMailsEnabled,
    };
  }
}
