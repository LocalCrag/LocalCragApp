import {
  authStorageKey,
  clearAuthStorage,
  LEGACY_AUTH_STORAGE_KEY,
  migrateLegacyAuthStorageIfNeeded,
  readAuthStorage,
  writeAuthStorage,
} from './auth-storage';

describe('auth-storage', () => {
  let store: Record<string, string>;
  const deps = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };

  beforeEach(() => {
    store = {};
  });

  it('builds a stable key for trailing-slash variants', () => {
    expect(authStorageKey('https://a.example/')).toBe(
      authStorageKey('https://a.example'),
    );
    expect(authStorageKey('https://a.example')).toBe(
      'LocalCragAuth:https://a.example',
    );
  });

  it('migrates legacy LocalCragAuth once into the host key', () => {
    store[LEGACY_AUTH_STORAGE_KEY] = '{"accessToken":"t"}';
    migrateLegacyAuthStorageIfNeeded('https://a.example/', deps);
    expect(store['LocalCragAuth:https://a.example']).toBe(
      '{"accessToken":"t"}',
    );
    expect(store[LEGACY_AUTH_STORAGE_KEY]).toBeUndefined();
    expect(readAuthStorage('https://a.example', deps)).toBe(
      '{"accessToken":"t"}',
    );
  });

  it('write and clear are host-scoped', () => {
    writeAuthStorage('https://a.example', 'A', deps);
    writeAuthStorage('https://b.example', 'B', deps);
    expect(readAuthStorage('https://a.example', deps)).toBe('A');
    clearAuthStorage('https://a.example', deps);
    expect(readAuthStorage('https://a.example', deps)).toBeNull();
    expect(readAuthStorage('https://b.example', deps)).toBe('B');
  });
});
