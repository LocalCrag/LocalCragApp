import {
  addInstance,
  hasCompletedInstanceOnboarding,
  isInstanceListEmpty,
  listInstances,
  removeInstance,
  SAVED_INSTANCES_PREFERENCE_KEY,
  setActiveHost,
} from './instance-registry';
import { API_HOST_PREFERENCE_KEY } from './runtime-api-host';

describe('instance-registry', () => {
  let store: Record<string, string>;
  const deps = {
    getPreference: async ({ key }: { key: string }) => ({
      value: store[key] ?? null,
    }),
    setPreference: async ({ key, value }: { key: string; value: string }) => {
      store[key] = value;
    },
    removePreference: async ({ key }: { key: string }) => {
      delete store[key];
    },
  };

  beforeEach(() => {
    store = {};
  });

  it('treats empty saved list as incomplete onboarding even if apiHost is seeded', async () => {
    store[API_HOST_PREFERENCE_KEY] = 'http://10.0.2.2:5000';
    await expectAsync(isInstanceListEmpty(deps)).toBeResolvedTo(true);
    await expectAsync(hasCompletedInstanceOnboarding(deps)).toBeResolvedTo(
      false,
    );
  });

  it('adds, lists, and removes instances with normalized URLs', async () => {
    await addInstance(
      { url: 'https://crag.example/', instanceName: 'Example' },
      deps,
    );
    const list = await listInstances(deps);
    expect(list).toEqual([
      { url: 'https://crag.example', instanceName: 'Example' },
    ]);
    expect(store[SAVED_INSTANCES_PREFERENCE_KEY]).toContain(
      'https://crag.example',
    );

    await removeInstance('https://crag.example/', deps);
    await expectAsync(listInstances(deps)).toBeResolvedTo([]);
    await expectAsync(hasCompletedInstanceOnboarding(deps)).toBeResolvedTo(
      false,
    );
  });

  it('setActiveHost writes API_HOST_PREFERENCE_KEY', async () => {
    await addInstance({ url: 'https://a.example' }, deps);
    const active = await setActiveHost('https://a.example/', deps);
    expect(active).toBe('https://a.example');
    expect(store[API_HOST_PREFERENCE_KEY]).toBe('https://a.example');
    await expectAsync(hasCompletedInstanceOnboarding(deps)).toBeResolvedTo(
      true,
    );
  });
});
