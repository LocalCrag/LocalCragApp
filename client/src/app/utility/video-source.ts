/**
 * Playable external videos. Keep the host rules aligned with server/src/util/videos.py.
 */

export type ExternalVideoProvider = 'youtube' | 'vimeo' | 'instagram';

export interface VideoEmbed {
  provider: ExternalVideoProvider | 'upload' | 'link';
  embedUrl: string | null;
  startSeconds: number;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,}$/;

export function providerForUrl(
  url: string | null | undefined,
): ExternalVideoProvider | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) {
    return null;
  }
  if (youtubeId(parsed)) {
    return 'youtube';
  }
  if (vimeoId(parsed)) {
    return 'vimeo';
  }
  if (instagramTarget(parsed)) {
    return 'instagram';
  }
  return null;
}

export function videoEmbed(video: {
  url: string;
  source?: string | null;
  fileId?: string | null;
  startSeconds?: number | null;
}): VideoEmbed {
  const explicitStart =
    video.startSeconds && video.startSeconds > 0 ? video.startSeconds : 0;
  const startSeconds = explicitStart || startFromUrl(video.url) || 0;
  if (video.source === 'upload' || video.fileId) {
    return { provider: 'upload', embedUrl: null, startSeconds };
  }
  const parsed = parseHttpUrl(video.url);
  if (!parsed) {
    return { provider: 'link', embedUrl: null, startSeconds };
  }
  const youtube = youtubeId(parsed);
  if (youtube) {
    const start = startSeconds > 0 ? `?start=${startSeconds}` : '';
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtube}${start}`,
      startSeconds,
    };
  }
  const vimeo = vimeoId(parsed);
  if (vimeo) {
    const start = startSeconds > 0 ? `#t=${startSeconds}s` : '';
    return {
      provider: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeo}${start}`,
      startSeconds,
    };
  }
  const instagram = instagramTarget(parsed);
  if (instagram) {
    return {
      provider: 'instagram',
      embedUrl: `https://www.instagram.com/${instagram.kind}/${instagram.code}/embed`,
      startSeconds: 0,
    };
  }
  return { provider: 'link', embedUrl: null, startSeconds };
}

export function formatVideoStart(
  seconds: number | null | undefined,
): string | null {
  if (seconds == null || seconds <= 0) {
    return null;
  }
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

function parseHttpUrl(url: string | null | undefined): URL | null {
  if (!url) {
    return null;
  }
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isYoutubeWatchHost(host: string): boolean {
  // The nocookie suffix needs a leading dot. Otherwise evil-youtube-nocookie.com matches.
  return (
    host === 'youtube.com' ||
    host.endsWith('.youtube.com') ||
    host === 'youtube-nocookie.com' ||
    host.endsWith('.youtube-nocookie.com')
  );
}

function youtubeId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase();
  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    return id && YOUTUBE_ID.test(id) ? id : null;
  }
  if (!isYoutubeWatchHost(host)) {
    return null;
  }
  if (parsed.pathname === '/watch') {
    const id = parsed.searchParams.get('v');
    return id && YOUTUBE_ID.test(id) ? id : null;
  }
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (
    parts.length >= 2 &&
    ['embed', 'shorts', 'live', 'v'].includes(parts[0]) &&
    YOUTUBE_ID.test(parts[1])
  ) {
    return parts[1];
  }
  return null;
}

function vimeoId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase();
  if (!['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
    return null;
  }
  const match = parsed.pathname.match(/(\d{6,12})/);
  return match ? match[1] : null;
}

function instagramTarget(parsed: URL): { kind: string; code: string } | null {
  const host = parsed.hostname.toLowerCase();
  if (
    !['instagram.com', 'www.instagram.com', 'm.instagram.com'].includes(host)
  ) {
    return null;
  }
  const parts = parsed.pathname.split('/').filter(Boolean);
  for (let index = 0; index < parts.length - 1; index++) {
    if (
      ['p', 'reel', 'reels', 'tv'].includes(parts[index]) &&
      INSTAGRAM_CODE.test(parts[index + 1])
    ) {
      const kind = parts[index] === 'reels' ? 'reel' : parts[index];
      return { kind, code: parts[index + 1] };
    }
  }
  return null;
}

function startFromUrl(url: string): number | null {
  const parsed = parseHttpUrl(url);
  if (!parsed) {
    return null;
  }
  const raw =
    parsed.searchParams.get('start') ||
    parsed.searchParams.get('t') ||
    new URLSearchParams(parsed.hash.replace(/^#/, '')).get('t');
  return raw ? parseClock(raw) : null;
}

function parseClock(raw: string): number | null {
  const value = raw.trim();
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!match || (!match[1] && !match[2] && !match[3])) {
    return null;
  }
  return (
    Number(match[1] || 0) * 3600 +
    Number(match[2] || 0) * 60 +
    Number(match[3] || 0)
  );
}
