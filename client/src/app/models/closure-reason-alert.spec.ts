import MessageFormat from '@messageformat/core';
import {
  ClosureReasonAlert,
  closureAlertMessage,
} from './closure-reason-alert';

/**
 * Transloco substitutes `{{param}}`, then MessageFormat compiles the result.
 * This mirrors that second step so a reason with braces is checked end to end.
 */
function translateLikeTransloco(
  key: string,
  params?: Record<string, unknown>,
): string {
  const templates: Record<string, string> = {
    'closedSpotAlert.closedWithReasonAndRange':
      'Closed ({{range}}): {{reason}}',
    'closedSpotAlert.closedWithReason': 'Closed: {{reason}}',
    'closedSpotAlert.closedWithRange': 'Closed ({{range}})',
    'closedSpotAlert.closedWithoutReason': 'Closed',
  };
  let value = templates[key];
  for (const [name, param] of Object.entries(params ?? {})) {
    value = value.split(`{{${name}}}`).join(String(param));
  }
  return new MessageFormat('en').compile(value)({});
}

describe('closureAlertMessage', () => {
  it('keeps braces and apostrophes in the reason as literal text', () => {
    const alert = new ClosureReasonAlert();
    alert.reason = "Closed {until further notice}. Don't climb.";

    expect(closureAlertMessage(alert, translateLikeTransloco, 'en')).toBe(
      "Closed: Closed {until further notice}. Don't climb.",
    );
  });

  it('leaves an ordinary reason unchanged', () => {
    const alert = new ClosureReasonAlert();
    alert.reason =
      'The rock at Golpe de Estado stays wet through this part of the year.';
    alert.startMonth = 11;
    alert.startDay = 1;
    alert.endMonth = 2;
    alert.endDay = 28;

    expect(closureAlertMessage(alert, translateLikeTransloco, 'en')).toBe(
      'Closed (01/11 – 28/02): The rock at Golpe de Estado stays wet through this part of the year.',
    );
  });
});
