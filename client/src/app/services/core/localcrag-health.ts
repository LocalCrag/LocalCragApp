/**
 * LocalCrag /api/health helpers.
 * Server may emit product+version (forward-compatible); save validation stays
 * legacy-friendly until operators upgrade (see deferred Phase 16 follow-up).
 */
export const LOCALCRAG_HEALTH_PRODUCT = 'localcrag';

/** Reserved for a later version-negotiation follow-up. */
export const LOCALCRAG_MIN_API_VERSION = '1.51.0';

export type LocalCragHealthResponse = {
  server?: string;
  database?: string | null;
  s3?: string | null;
  product?: string;
  version?: string;
};

/**
 * Reachability check for instance save: legacy `{ server: "healthy" }` is enough.
 * If `product` is present it must be LocalCrag (rejects spoofed product values).
 */
export function isLocalCragHealthResponse(
  body: unknown,
): body is LocalCragHealthResponse {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const record = body as Record<string, unknown>;
  if (record['server'] !== 'healthy') {
    return false;
  }
  if (
    'product' in record &&
    record['product'] !== undefined &&
    record['product'] !== null &&
    record['product'] !== LOCALCRAG_HEALTH_PRODUCT
  ) {
    return false;
  }
  return true;
}

/**
 * Compare dotted semver-ish strings (major.minor.patch); non-numeric segments → 0.
 * Reserved for a later soft-warn / negotiation follow-up — not used in picker UX yet.
 */
export function isBelowMinApiVersion(
  remoteVersion: string,
  minVersion: string = LOCALCRAG_MIN_API_VERSION,
): boolean {
  const remote = parseVersionParts(remoteVersion);
  const min = parseVersionParts(minVersion);
  for (let i = 0; i < 3; i++) {
    if (remote[i] < min[i]) {
      return true;
    }
    if (remote[i] > min[i]) {
      return false;
    }
  }
  return false;
}

function parseVersionParts(version: string): [number, number, number] {
  const parts = version
    .trim()
    .split('.')
    .map((p) => {
      const n = parseInt(p, 10);
      return Number.isFinite(n) ? n : 0;
    });
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}
