import {
  LEGACY_ROCK_EXPLORER_DB_NAME,
  openRockExplorerDraftDb,
  rockExplorerDbName,
} from './rock-explorer-draft.db';

describe('rockExplorerDbName', () => {
  it('namespaces by normalized host', () => {
    expect(rockExplorerDbName('https://a.example/')).toBe(
      `${LEGACY_ROCK_EXPLORER_DB_NAME}:https://a.example`,
    );
    expect(rockExplorerDbName('https://a.example')).not.toBe(
      rockExplorerDbName('https://b.example'),
    );
  });
});

describe('openRockExplorerDraftDb', () => {
  it('returns distinct DB instances for distinct hosts', () => {
    const a = openRockExplorerDraftDb('https://a.example');
    const b = openRockExplorerDraftDb('https://b.example');
    expect(a.name).not.toBe(b.name);
    expect(openRockExplorerDraftDb('https://a.example/')).toBe(a);
  });
});
