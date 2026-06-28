import { File } from '../models/file';

export function effectiveLogoImage(
  logo: File | null,
  darkLogo: File | null,
  isDarkMode: boolean,
): File | null {
  if (isDarkMode && darkLogo) {
    return darkLogo;
  }
  return logo;
}

export function effectiveBarChartColor(
  color: string | null,
  darkColor: string | null,
  isDarkMode: boolean,
): string | null {
  if (isDarkMode && darkColor?.trim()) {
    return darkColor.trim();
  }
  return color;
}

export function effectiveBarChartAccentColor(
  accentColor: string | null,
  darkAccentColor: string | null,
  isDarkMode: boolean,
): string | null {
  if (isDarkMode && darkAccentColor?.trim()) {
    return darkAccentColor.trim();
  }
  return accentColor;
}
