import {
  effectiveBarChartAccentColor,
  effectiveBarChartColor,
} from './instance-settings-theme';

export type ChartThemeColors = {
  textColor: string;
  mutedTextColor: string;
  gridColor: string;
  contentBorderColor: string;
};

let colorProbe: HTMLSpanElement | null = null;

function getColorProbe(): HTMLSpanElement {
  if (!colorProbe) {
    colorProbe = document.createElement('span');
    colorProbe.style.display = 'none';
    document.documentElement.appendChild(colorProbe);
  }
  return colorProbe;
}

/**
 * Resolves a PrimeNG CSS variable to an rgb/rgba string Chart.js can use.
 */
export function resolveCssColorVar(varName: string, fallback: string): string {
  const probe = getColorProbe();
  probe.style.color = `var(${varName})`;
  const resolved = getComputedStyle(probe).color.trim();
  if (!resolved || resolved === 'rgba(0, 0, 0, 0)') {
    return fallback;
  }
  return resolved;
}

export function getChartThemeColors(): ChartThemeColors {
  return {
    textColor: resolveCssColorVar('--p-text-color', 'rgb(0, 0, 0)'),
    mutedTextColor: resolveCssColorVar(
      '--p-text-muted-color',
      'rgb(100, 116, 139)',
    ),
    gridColor: resolveCssColorVar(
      '--p-content-border-color',
      'rgba(128, 128, 128, 0.15)',
    ),
    contentBorderColor: resolveCssColorVar(
      '--p-content-border-color',
      'rgba(128, 128, 128, 0.25)',
    ),
  };
}

export function resolveBarChartColor(
  color: string | null | undefined,
  darkColor: string | null | undefined,
  isDarkMode: boolean,
): string {
  const effective = effectiveBarChartColor(
    color ?? null,
    darkColor ?? null,
    isDarkMode,
  )?.trim();
  if (effective) {
    return effective;
  }
  return isDarkMode
    ? resolveCssColorVar('--p-red-400', 'rgb(239, 68, 68)')
    : resolveCssColorVar('--p-red-500', 'rgb(239, 68, 68)');
}

export function resolveBarChartAccentColor(
  color: string | null | undefined,
  darkColor: string | null | undefined,
  isDarkMode: boolean,
): string {
  const effective = effectiveBarChartAccentColor(
    color ?? null,
    darkColor ?? null,
    isDarkMode,
  )?.trim();
  if (effective) {
    return effective;
  }
  return isDarkMode
    ? resolveCssColorVar('--p-yellow-300', 'rgb(250, 204, 21)')
    : resolveCssColorVar('--p-yellow-400', 'rgb(250, 204, 21)');
}

/**
 * Converts any browser-resolvable color string to rgba().
 */
export function toRgba(color: string, alpha: number): string {
  const probe = getColorProbe();
  probe.style.color = color;
  const resolved = getComputedStyle(probe).color.trim();
  const match = resolved.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) {
    return color;
  }
  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
}
