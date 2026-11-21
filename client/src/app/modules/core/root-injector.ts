import { Injector, type ProviderToken } from '@angular/core';

let rootInjector: Injector | null = null;

/** Captures the application injector so core helpers can open dialogs later. */
export function setRootInjector(injector: Injector): void {
  rootInjector = injector;
}

export function rootInject<T>(token: ProviderToken<T>): T {
  if (!rootInjector) {
    throw new Error('Root injector is not ready');
  }
  return rootInjector.get(token);
}
