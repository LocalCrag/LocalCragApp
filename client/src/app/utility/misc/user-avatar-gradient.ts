/**
 * FNV-1a 32-bit hash for stable, client-only seeds (e.g. username / slug).
 */
export function fnv1a32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * CSS linear-gradient string derived from a seed string (typically user slug).
 */
export function userAvatarGradientCss(seed: string): string {
  const h = fnv1a32(seed.length ? seed : ' ');
  const h1 = h & 0xffff;
  const h2 = (h >>> 16) & 0xffff;
  const hue1 = h1 % 360;
  const hue2 = (hue1 + 40 + (h2 % 70)) % 360;
  const sat = 52 + (h2 % 18);
  const l1 = 46 + (h % 8);
  const l2 = 40 + ((h >>> 8) % 10);
  return `linear-gradient(135deg, hsl(${hue1}, ${sat}%, ${l1}%), hsl(${hue2}, ${sat}%, ${l2}%))`;
}

/**
 * Two-letter initials from first and last name, or "?" if both are empty.
 */
export function userInitials(
  firstname?: string | null,
  lastname?: string | null,
): string {
  const f = (firstname?.trim() ?? '').charAt(0);
  const l = (lastname?.trim() ?? '').charAt(0);
  const out = `${f}${l}`.toUpperCase();
  return out || '?';
}
