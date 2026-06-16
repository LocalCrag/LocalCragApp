const FALLBACK_TIMEZONES = ['UTC'];

/** Common timezones for the app's supported languages (de, en, it, nl). */
const PRIORITY_TIMEZONES = [
  'UTC',
  'Europe/Berlin',
  'Europe/Vienna',
  'Europe/Zurich',
  'Europe/Amsterdam',
  'Europe/Rome',
  'Europe/London',
];

type IntlWithSupportedValues = typeof Intl & {
  supportedValuesOf?: (key: 'timeZone') => string[];
};

export interface InstanceTimezoneOption {
  label: string;
  value: string;
}

function formatUtcOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const offset = parts.find((part) => part.type === 'timeZoneName')?.value;
    return offset?.replace(/^GMT/, 'UTC') ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

function timezoneOption(timezone: string): InstanceTimezoneOption {
  return {
    label: `${timezone} (${formatUtcOffset(timezone)})`,
    value: timezone,
  };
}

export function getInstanceTimezoneOptions(): InstanceTimezoneOption[] {
  const intl = Intl as IntlWithSupportedValues;
  const timezones =
    typeof intl.supportedValuesOf === 'function'
      ? intl.supportedValuesOf('timeZone')
      : FALLBACK_TIMEZONES;

  const available = new Set(timezones);
  const prioritySet = new Set(PRIORITY_TIMEZONES);
  const priority = PRIORITY_TIMEZONES.filter((timezone) =>
    available.has(timezone),
  ).map(timezoneOption);
  const rest = [...available]
    .filter((timezone) => !prioritySet.has(timezone))
    .sort()
    .map(timezoneOption);

  return [...priority, ...rest];
}
