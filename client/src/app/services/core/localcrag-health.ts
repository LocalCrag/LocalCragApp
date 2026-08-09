/**
 * LocalCrag /api/health identity contract (Phase 16 D-05).
 * Must match server util.localcrag_product.LOCALCRAG_PRODUCT / LOCALCRAG_VERSION.
 */
export const LOCALCRAG_HEALTH_PRODUCT = 'localcrag';

/** Soft-gate minimum API version for the bundled client (D-07). */
export const LOCALCRAG_MIN_API_VERSION = '1.51.0';

export type LocalCragHealthResponse = {
  server?: string;
  database?: string | null;
  s3?: string | null;
  product?: string;
  version?: string;
};

/**
 * Strict acceptance: identity constant + non-empty version required (D-05).
 */
export function isLocalCragHealthResponse(
  body: unknown,
): body is LocalCragHealthResponse {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const record = body as Record<string, unknown>;
  return (
    record['product'] === LOCALCRAG_HEALTH_PRODUCT &&
    typeof record['version'] === 'string' &&
    (record['version'] as string).length > 0
  );
}

/**
 * Compare dotted semver-ish strings (major.minor.patch); non-numeric segments → 0.
 * Returns true when remote is below min (soft warn, D-07).
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
