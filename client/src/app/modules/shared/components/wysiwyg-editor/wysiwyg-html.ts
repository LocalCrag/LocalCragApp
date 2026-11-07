/**
 * HTML helpers shared by the editor.
 */

const MEDIA_TAG = /<(img|iframe|video|ul|ol)\b/i;

export function isVisuallyEmptyHtml(html: string | null | undefined): boolean {
  if (!html) {
    return true;
  }
  if (MEDIA_TAG.test(html)) {
    return false;
  }
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, '');
  return text.length === 0;
}

export function normalizeWysiwygOutput(html: string): string {
  return isVisuallyEmptyHtml(html) ? '' : html;
}

export type WysiwygMediaWidth = number | 'full' | null;

export function imageWidth(element: HTMLElement): WysiwygMediaWidth {
  const style = element.style.width.trim().toLowerCase();
  if (style === '100%') {
    return 'full';
  }
  const attr = element.getAttribute('width');
  if (attr && /^\d+(\.\d+)?$/.test(attr)) {
    return Math.round(Number(attr));
  }
  const match = /^(\d+(?:\.\d+)?)px$/.exec(style);
  return match ? Math.round(Number(match[1])) : null;
}

export function writeMediaWidth(
  element: HTMLElement,
  width: WysiwygMediaWidth,
) {
  if (width === 'full') {
    element.removeAttribute('width');
    element.style.width = '100%';
    return;
  }
  if (typeof width === 'number' && width > 0) {
    element.setAttribute('width', String(width));
    element.style.width = `${width}px`;
    return;
  }
  element.removeAttribute('width');
  element.style.width = '';
}

/** Accepts only absolute http(s) URLs so pasted markup cannot set a script source. */
export function safeMediaUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
