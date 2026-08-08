import type { RockExplorerMockGpsService } from './rock-explorer-mock-gps.service';

/**
 * Dev loader: dynamic-imports {@link RockExplorerMockGpsService}.
 *
 * Production / e2e builds replace this file with
 * `rock-explorer-mock-gps.loader.prod.ts` (via `fileReplacements` in
 * `angular.json`) so the walker implementation is never on the prod module
 * graph. Call only when `mockGpsRecording` is true.
 */
export async function loadMockGps(): Promise<RockExplorerMockGpsService | null> {
  const { RockExplorerMockGpsService } =
    await import('./rock-explorer-mock-gps.service');
  return new RockExplorerMockGpsService();
}
