// zone.js's Vitest patch no-ops unless a `vitest` global exists. Vitest 5
// does not set one; the patch only uses the object as a "already patched" flag.
(globalThis as { vitest?: object }).vitest ??= {};
