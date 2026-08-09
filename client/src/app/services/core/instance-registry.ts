import { Preferences } from '@capacitor/preferences';
import {
  API_HOST_PREFERENCE_KEY,
  normalizeApiHostUrl,
} from './runtime-api-host';

/** Preferences key for the saved instance list (JSON array). */
export const SAVED_INSTANCES_PREFERENCE_KEY = 'savedInstances';

export type SavedInstance = {
  url: string;
  instanceName?: string | null;
  apiVersion?: string | null;
  lastUsedAt?: string | null;
};

export type InstanceRegistryDeps = {
  getPreference: (options: {
    key: string;
  }) => Promise<{ value: string | null }>;
  setPreference: (options: { key: string; value: string }) => Promise<void>;
  removePreference: (options: { key: string }) => Promise<void>;
};

function defaultDeps(): InstanceRegistryDeps {
  return {
    getPreference: (options) => Preferences.get(options),
    setPreference: (options) => Preferences.set(options),
    removePreference: (options) => Preferences.remove(options),
  };
}

function mergeDeps(
  deps: Partial<InstanceRegistryDeps> = {},
): InstanceRegistryDeps {
  return { ...defaultDeps(), ...deps };
}

async function readList(deps: InstanceRegistryDeps): Promise<SavedInstance[]> {
  const { value } = await deps.getPreference({
    key: SAVED_INSTANCES_PREFERENCE_KEY,
  });
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (item): item is SavedInstance =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as SavedInstance).url === 'string',
      )
      .map((item) => ({
        ...item,
        url: normalizeApiHostUrl(item.url),
      }));
  } catch {
    return [];
  }
}

async function writeList(
  deps: InstanceRegistryDeps,
  list: SavedInstance[],
): Promise<void> {
  await deps.setPreference({
    key: SAVED_INSTANCES_PREFERENCE_KEY,
    value: JSON.stringify(list),
  });
}

export async function listInstances(
  deps: Partial<InstanceRegistryDeps> = {},
): Promise<SavedInstance[]> {
  return readList(mergeDeps(deps));
}

export async function isInstanceListEmpty(
  deps: Partial<InstanceRegistryDeps> = {},
): Promise<boolean> {
  const list = await listInstances(deps);
  return list.length === 0;
}

/**
 * Onboarding is complete only when the user has at least one saved instance.
 * A Phase 15 auto-seeded apiHost alone does NOT count (D-01 / RESEARCH).
 */
export async function hasCompletedInstanceOnboarding(
  deps: Partial<InstanceRegistryDeps> = {},
): Promise<boolean> {
  return !(await isInstanceListEmpty(deps));
}

export async function addInstance(
  instance: SavedInstance,
  deps: Partial<InstanceRegistryDeps> = {},
): Promise<SavedInstance[]> {
  const d = mergeDeps(deps);
  const url = normalizeApiHostUrl(instance.url);
  const list = await readList(d);
  const without = list.filter((item) => item.url !== url);
  without.push({
    ...instance,
    url,
  });
  await writeList(d, without);
  return without;
}

export async function removeInstance(
  url: string,
  deps: Partial<InstanceRegistryDeps> = {},
): Promise<SavedInstance[]> {
  const d = mergeDeps(deps);
  const normalized = normalizeApiHostUrl(url);
  const next = (await readList(d)).filter((item) => item.url !== normalized);
  await writeList(d, next);
  return next;
}

export async function setActiveHost(
  url: string,
  deps: Partial<InstanceRegistryDeps> = {},
): Promise<string> {
  const d = mergeDeps(deps);
  const normalized = normalizeApiHostUrl(url);
  await d.setPreference({
    key: API_HOST_PREFERENCE_KEY,
    value: normalized,
  });
  const list = await readList(d);
  const idx = list.findIndex((item) => item.url === normalized);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      lastUsedAt: new Date().toISOString(),
    };
    await writeList(d, list);
  }
  return normalized;
}
