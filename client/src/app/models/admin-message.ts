import { AbstractModel } from './abstract-model';

/**
 * Admin-authored broadcast message delivered as an inbox notification.
 */
export class AdminMessage extends AbstractModel {
  title: string;
  text: string;

  public static deserialize(payload: any): AdminMessage {
    const message = new AdminMessage();
    AbstractModel.deserializeAbstractAttributes(message, payload);
    message.title = payload.title;
    message.text = payload.text;
    return message;
  }

  public static serialize(message: AdminMessage): any {
    return {
      title: message.title,
      text: message.text,
    };
  }
}
