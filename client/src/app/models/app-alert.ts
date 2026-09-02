import { AbstractModel } from './abstract-model';
import { AppAlertSeverity } from '../enums/app-alert-severity';
import { parseServerUtcDate } from '../utility/parse-server-utc-date';

/**
 * Instance-wide banner alert shown in the site header.
 */
export class AppAlert extends AbstractModel {
  message: string;
  severity: AppAlertSeverity;
  readMoreUrl: string | null;
  startsAt: Date;
  endsAt: Date;

  public static deserialize(payload: any): AppAlert {
    const alert = new AppAlert();
    AbstractModel.deserializeAbstractAttributes(alert, payload);
    alert.message = payload.message;
    alert.severity = payload.severity as AppAlertSeverity;
    alert.readMoreUrl = payload.readMoreUrl ?? null;
    alert.startsAt = parseServerUtcDate(payload.startsAt)!;
    alert.endsAt = parseServerUtcDate(payload.endsAt)!;
    return alert;
  }

  public static serialize(alert: AppAlert): any {
    return {
      message: alert.message,
      severity: alert.severity,
      readMoreUrl: alert.readMoreUrl,
      startsAt: alert.startsAt.toISOString(),
      endsAt: alert.endsAt.toISOString(),
    };
  }
}
