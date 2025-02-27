export function getRgbObject(raw: string): any {
  if (!raw) {
    return {
      r: 0,
      g: 0,
      b: 0,
    };
  }
  const matches = raw.match(/rgb\((\d+), ?(\d+), ?(\d+)\)/);
  return {
    r: Number(matches[1]),
    g: Number(matches[2]),
    b: Number(matches[3]),
  };
}

function extractColor(color: string) {
  const ret = {
    r: parseInt(color.slice(1, 3), 16),
    g: parseInt(color.slice(3, 5), 16),
    b: parseInt(color.slice(5, 7), 16),
    brightness: 0,
  };
  ret.brightness = (ret.r * 299 + ret.g * 587 + ret.b * 114) / 1000;
  return ret;
}

/**
 * Given a color, calculate an accented variant so an object looks highlighted
 *
 * @param color Color as hex string, e.g., #abba42. May be undefined
 * @return Hex color string, or undefined if color is undefined
 */
export function highlightColor(color?: string): string | undefined {
  if (color) {
    const { r, g, b, brightness } = extractColor(color);

    const adjust = brightness < 128 ? 60 : -60;
    const lighten = (value) => Math.min(255, Math.max(0, value + adjust));

    return `#${[lighten(r), lighten(g), lighten(b)]
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')}`;
  }
  return undefined;
}

/**
 * Given a color, return black or white as text color, depending on what has the better contrast
 *
 * @param color Color as hex string, e.g., #abba42. May be undefined
 * @param blackOverwrite Optional color to use as black (#000000 if not given)
 * @param whiteOverwrite Optional color to use as white (#ffffff if not given)
 * @return Hex color string, or undefined if color is undefined
 */
export function textColor(
  color?: string,
  blackOverwrite?: string,
  whiteOverwrite?: string,
): string | undefined {
  const black = blackOverwrite || '#000000';
  const white = whiteOverwrite || '#ffffff';
  if (color) {
    const { brightness } = extractColor(color);
    return brightness < 128 ? white : black;
  }
  return undefined;
}
