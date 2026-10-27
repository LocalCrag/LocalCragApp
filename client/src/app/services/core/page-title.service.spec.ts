import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RoutesRecognized,
} from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import {
  PageTitleService,
  PageTitleState,
  routeHidesPageTitle,
  routePrefersHeroTitle,
} from './page-title.service';
import { getPrimaryPageHostKey } from '../../utility/router/primary-page-host-key';

describe('routeHidesPageTitle', () => {
  function snap(
    data: Record<string, unknown> = {},
    children: ActivatedRouteSnapshot[] = [],
  ): ActivatedRouteSnapshot {
    return {
      data,
      children,
      outlet: 'primary',
    } as unknown as ActivatedRouteSnapshot;
  }

  it('returns false for an empty tree', () => {
    expect(routeHidesPageTitle(snap())).toBeFalse();
  });

  it('returns true when hidePageTitle is set on a descendant', () => {
    const root = snap({}, [snap({ hidePageTitle: true })]);
    expect(routeHidesPageTitle(root)).toBeTrue();
  });

  it('returns true when fullscreenMap is set', () => {
    const root = snap({}, [snap({ fullscreenMap: true })]);
    expect(routeHidesPageTitle(root)).toBeTrue();
  });
});

describe('routePrefersHeroTitle', () => {
  function snap(
    data: Record<string, unknown> = {},
    children: ActivatedRouteSnapshot[] = [],
  ): ActivatedRouteSnapshot {
    return {
      data,
      children,
      outlet: 'primary',
    } as unknown as ActivatedRouteSnapshot;
  }

  it('returns null when unset', () => {
    expect(routePrefersHeroTitle(snap())).toBeNull();
  });

  it('returns true when pageTitleHero is set', () => {
    const root = snap({}, [snap({ pageTitleHero: true })]);
    expect(routePrefersHeroTitle(root)).toBeTrue();
  });

  it('returns false when pageTitleHero is explicitly false', () => {
    const root = snap({}, [snap({ pageTitleHero: false })]);
    expect(routePrefersHeroTitle(root)).toBeFalse();
  });
});

describe('PageTitleService', () => {
  let service: PageTitleService;
  let routerEvents: Subject<unknown>;
  let routerStateRoot: ActivatedRouteSnapshot;

  function makeRoot(
    path: string,
    data: Record<string, unknown> = {},
  ): ActivatedRouteSnapshot {
    const child = {
      data,
      children: [],
      outlet: 'primary',
      routeConfig: { path, loadComponent: () => Promise.resolve(null) },
      pathFromRoot: [{ routeConfig: { path: '' } }, { routeConfig: { path } }],
    } as unknown as ActivatedRouteSnapshot;

    return {
      data: {},
      children: [child],
      outlet: 'primary',
      routeConfig: null,
      pathFromRoot: [{ routeConfig: { path: '' } }],
    } as unknown as ActivatedRouteSnapshot;
  }

  beforeEach(() => {
    routerEvents = new Subject();
    routerStateRoot = makeRoot('news');

    TestBed.configureTestingModule({
      providers: [
        PageTitleService,
        {
          provide: Router,
          useValue: {
            events: routerEvents.asObservable(),
            routerState: {
              get snapshot() {
                return { root: routerStateRoot };
              },
            },
          },
        },
      ],
    });

    service = TestBed.inject(PageTitleService);
  });

  async function latestState(): Promise<PageTitleState> {
    // setTitle applies on a microtask so it does not flip the header mid-check.
    await Promise.resolve();
    return firstValueFrom(service.state$);
  }

  it('starts not loading', async () => {
    expect((await latestState()).loading).toBeFalse();
  });

  it('enters loading on page-host change', async () => {
    service.setTitle('News');
    expect((await latestState()).loading).toBeFalse();

    const nextRoot = makeRoot('topo/:crag-slug');
    routerEvents.next(
      new RoutesRecognized(1, '/topo/foo', '/topo/foo', {
        root: nextRoot,
      } as never),
    );

    const state = await latestState();
    expect(state.loading).toBeTrue();
    expect(state.title).toBeNull();
  });

  it('uses hero-sized skeleton for pageTitleHero destinations', async () => {
    service.setTitle('News');
    expect((await latestState()).heroDefaultBg).toBeFalse();

    const nextRoot = makeRoot('topo/:crag-slug', { pageTitleHero: true });
    routerEvents.next(
      new RoutesRecognized(1, '/topo/a', '/topo/a', {
        root: nextRoot,
      } as never),
    );

    const state = await latestState();
    expect(state.loading).toBeTrue();
    expect(state.loadingHero).toBeTrue();
  });

  it('uses hero-sized skeleton after a portrait title', async () => {
    service.setPortraitTitle('Crag', null, null);
    expect((await latestState()).heroDefaultBg).toBeTrue();

    const nextRoot = makeRoot('topo/:crag-slug/:sector-slug');
    routerEvents.next(
      new RoutesRecognized(1, '/topo/a/b', '/topo/a/b', {
        root: nextRoot,
      } as never),
    );

    const state = await latestState();
    expect(state.loading).toBeTrue();
    expect(state.loadingHero).toBeTrue();
  });

  it('keeps tabs and breadcrumbs set in the same turn as the title', async () => {
    service.setTitle('Shark Attack');
    service.setBreadcrumbs([{ label: 'Brione' }], { icon: 'pi pi-map' });
    service.setTabs([{ label: 'Lines' }]);

    const state = await latestState();
    expect(state.loading).toBeFalse();
    expect(state.title).toBe('Shark Attack');
    expect(state.breadcrumbs).toEqual([{ label: 'Brione' }]);
    expect(state.breadcrumbHome).toEqual({ icon: 'pi pi-map' });
    expect(state.tabs).toEqual([{ label: 'Lines' }]);
  });

  it('clears tabs when a later title replaces the header', async () => {
    service.setTitle('Shark Attack');
    service.setTabs([{ label: 'Lines' }]);
    await latestState();

    service.setTitle('Other');
    const state = await latestState();
    expect(state.title).toBe('Other');
    expect(state.tabs).toBeNull();
  });

  it('drops a deferred title when navigation starts first', async () => {
    service.setTitle('Shark Attack');
    service.setTabs([{ label: 'Lines' }]);

    const nextRoot = makeRoot('topo/:crag-slug');
    routerEvents.next(
      new RoutesRecognized(1, '/topo/foo', '/topo/foo', {
        root: nextRoot,
      } as never),
    );

    const state = await latestState();
    expect(state.loading).toBeTrue();
    expect(state.title).toBeNull();
    expect(state.tabs).toBeNull();
  });

  it('clears loading when setTitle is called', async () => {
    const nextRoot = makeRoot('scales');
    routerEvents.next(
      new RoutesRecognized(1, '/scales', '/scales', {
        root: nextRoot,
      } as never),
    );
    expect((await latestState()).loading).toBeTrue();

    service.setTitle('Scales');
    const state = await latestState();
    expect(state.loading).toBeFalse();
    expect(state.title).toBe('Scales');
  });

  it('resets without skeleton for hidePageTitle routes', async () => {
    service.setTitle('News');
    const nextRoot = makeRoot('login', { hidePageTitle: true });
    routerEvents.next(
      new RoutesRecognized(1, '/login', '/login', {
        root: nextRoot,
      } as never),
    );

    const state = await latestState();
    expect(state.loading).toBeFalse();
    expect(state.title).toBeNull();
  });

  it('updates current host key on NavigationEnd', () => {
    const nextRoot = makeRoot('history');
    routerEvents.next(
      new RoutesRecognized(1, '/history', '/history', {
        root: nextRoot,
      } as never),
    );
    routerStateRoot = nextRoot;
    routerEvents.next(new NavigationEnd(1, '/history', '/history'));

    expect(getPrimaryPageHostKey(routerStateRoot)).toContain('history');
  });

  it('keeps the header when a child route opts out of being a page host', async () => {
    const tree = makeNestedRoot('');
    const detail = makeNestedRoot('region');
    expect(getPrimaryPageHostKey(tree)).toBe(getPrimaryPageHostKey(detail));

    routerEvents.next(
      new RoutesRecognized(1, '/topo-quality', '/topo-quality', {
        root: tree,
      } as never),
    );
    routerStateRoot = tree;
    routerEvents.next(new NavigationEnd(1, '/topo-quality', '/topo-quality'));
    service.setTitle('Topo quality', { heroDefaultBg: true });

    routerEvents.next(
      new RoutesRecognized(2, '/topo-quality/region', '/topo-quality/region', {
        root: detail,
      } as never),
    );

    const state = await latestState();
    expect(state.loading).toBeFalse();
    expect(state.title).toBe('Topo quality');
  });
});

function makeNestedRoot(childPath: string): ActivatedRouteSnapshot {
  const root = {} as ActivatedRouteSnapshot;
  const parent = {} as ActivatedRouteSnapshot;
  const child = {} as ActivatedRouteSnapshot;
  Object.assign(root, {
    data: {},
    children: [parent],
    outlet: 'primary',
    routeConfig: { path: '' },
    pathFromRoot: [root],
  });
  Object.assign(parent, {
    data: { pageTitleHero: true },
    children: [child],
    outlet: 'primary',
    routeConfig: {
      path: 'topo-quality',
      loadComponent: () => Promise.resolve(null),
      data: { pageTitleHero: true },
    },
    pathFromRoot: [root, parent],
  });
  Object.assign(child, {
    data: { pageTitleHost: false },
    children: [],
    outlet: 'primary',
    routeConfig: {
      path: childPath,
      loadComponent: () => Promise.resolve(null),
      data: { pageTitleHost: false },
    },
    pathFromRoot: [root, parent, child],
  });
  return root;
}
