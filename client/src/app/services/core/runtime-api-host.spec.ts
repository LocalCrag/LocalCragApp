import { API_HOST_PREFERENCE_KEY, resolveApiHost } from './runtime-api-host';

describe('resolveApiHost', () => {
  it('returns defaultHost on web without touching Preferences', async () => {
    const getPreference = jasmine.createSpy('getPreference');
    const setPreference = jasmine.createSpy('setPreference');

    await expectAsync(
      resolveApiHost({
        isNativePlatform: () => false,
        defaultHost: 'http://127.0.0.1:5000',
        getPreference,
        setPreference,
      }),
    ).toBeResolvedTo('http://127.0.0.1:5000');
    expect(getPreference).not.toHaveBeenCalled();
    expect(setPreference).not.toHaveBeenCalled();
  });

  it('returns stored Preferences value on native when set', async () => {
    const getPreference = jasmine
      .createSpy('getPreference')
      .and.resolveTo({ value: 'https://example.localcrag.test' });
    const setPreference = jasmine.createSpy('setPreference');

    await expectAsync(
      resolveApiHost({
        isNativePlatform: () => true,
        defaultHost: 'http://10.0.2.2:5000',
        getPreference,
        setPreference,
      }),
    ).toBeResolvedTo('https://example.localcrag.test');
    expect(getPreference).toHaveBeenCalledWith({
      key: API_HOST_PREFERENCE_KEY,
    });
    expect(setPreference).not.toHaveBeenCalled();
  });

  it('seeds Preferences from defaultHost on native when unset', async () => {
    const getPreference = jasmine
      .createSpy('getPreference')
      .and.resolveTo({ value: null });
    const setPreference = jasmine
      .createSpy('setPreference')
      .and.resolveTo(undefined);

    await expectAsync(
      resolveApiHost({
        isNativePlatform: () => true,
        defaultHost: 'http://10.0.2.2:5000',
        getPreference,
        setPreference,
      }),
    ).toBeResolvedTo('http://10.0.2.2:5000');
    expect(setPreference).toHaveBeenCalledWith({
      key: API_HOST_PREFERENCE_KEY,
      value: 'http://10.0.2.2:5000',
    });
  });
});

describe('API_HOST_PREFERENCE_KEY', () => {
  it('is the literal apiHost key Phase 16 must reuse (D-03)', () => {
    expect(API_HOST_PREFERENCE_KEY).toBe('apiHost');
  });
});
