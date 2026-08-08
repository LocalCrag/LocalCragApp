import type { RockExplorerMockGpsService } from './rock-explorer-mock-gps.service';

/**
 * Production / e2e stub swapped in via `angular.json` `fileReplacements`.
 * Returns null and must not import the real service module at runtime.
 */
export async function loadMockGps(): Promise<RockExplorerMockGpsService | null> {
  return null;
}
