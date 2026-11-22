export type CondiSky =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'night'
  | 'nightCloudy';

export const CONDI_SKY_ICON: Record<CondiSky, string> = {
  clear: 'lucideSun',
  partlyCloudy: 'lucideCloudSun',
  cloudy: 'lucideCloud',
  rain: 'lucideCloudRain',
  snow: 'lucideCloudSnow',
  night: 'lucideMoon',
  nightCloudy: 'lucideCloudMoon',
};

export interface CondiSkyHour {
  valid_at: string;
  temperature_c: number | null;
  rain_mm: number | null;
  rain_probability_pct: number | null;
  cloud_cover_pct: number | null;
  solar_radiation_pct: number | null;
}

export interface CondiSkyDay {
  local_date: string;
  sunrise_at: string | null;
  sunset_at: string | null;
}

/**
 * A coarse sky symbol from the hourly fields we already cache.
 * CondiCaster's own icon set uses a weather code we do not store.
 */
export function condiSky(
  hour: CondiSkyHour,
  day: CondiSkyDay | undefined,
): CondiSky {
  const raining =
    (hour.rain_mm ?? 0) >= 0.1 || (hour.rain_probability_pct ?? 0) >= 55;
  if (raining && hour.temperature_c != null && hour.temperature_c <= 0) {
    return 'snow';
  }
  if (raining) {
    return 'rain';
  }
  const clouds = hour.cloud_cover_pct ?? 0;
  if (isNight(hour, day)) {
    if (clouds >= 70) {
      return 'cloudy';
    }
    if (clouds >= 25) {
      return 'nightCloudy';
    }
    return 'night';
  }
  if (clouds < 25) {
    return 'clear';
  }
  if (clouds < 70) {
    return 'partlyCloudy';
  }
  return 'cloudy';
}

const SKY_SEVERITY: CondiSky[] = [
  'snow',
  'rain',
  'cloudy',
  'nightCloudy',
  'partlyCloudy',
  'night',
  'clear',
];

/**
 * One icon for a forecast day. Daytime hours win when we have them.
 * Later days only carry explanation factors, so snow and showers map to icons
 * and anything else stays cloudy.
 */
export function condiDaySky(
  day: CondiSkyDay & { explanation?: { factors?: string[] } | null },
  hours: CondiSkyHour[],
): CondiSky {
  const daytime = hours.filter((hour) => !isNight(hour, day));
  const sample = daytime.length ? daytime : hours;
  if (sample.length) {
    return dominantSky(sample.map((hour) => condiSky(hour, day)));
  }
  const factors = day.explanation?.factors ?? [];
  if (factors.includes('snow')) {
    return 'snow';
  }
  if (factors.includes('showers')) {
    return 'rain';
  }
  return 'cloudy';
}

function dominantSky(skies: CondiSky[]): CondiSky {
  const counts = new Map<CondiSky, number>();
  for (const sky of skies) {
    counts.set(sky, (counts.get(sky) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => {
    const byCount = right[1] - left[1];
    if (byCount !== 0) {
      return byCount;
    }
    return SKY_SEVERITY.indexOf(left[0]) - SKY_SEVERITY.indexOf(right[0]);
  })[0][0];
}

function isNight(hour: CondiSkyHour, day: CondiSkyDay | undefined): boolean {
  const at = Date.parse(hour.valid_at);
  const rise = day?.sunrise_at ? Date.parse(day.sunrise_at) : NaN;
  const set = day?.sunset_at ? Date.parse(day.sunset_at) : NaN;
  if (Number.isFinite(at) && Number.isFinite(rise) && Number.isFinite(set)) {
    return at < rise || at >= set;
  }
  return (hour.solar_radiation_pct ?? 0) <= 0;
}
