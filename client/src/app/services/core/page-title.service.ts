import { DestroyRef, Injectable, TemplateRef, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  PRIMARY_OUTLET,
  Router,
  RoutesRecognized,
} from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { File } from '../../models/file';
import { TopoImage } from '../../models/topo-image';
import { imageFocusBackgroundStyles } from '../../utility/image-focus';
import { getPrimaryPageHostKey } from '../../utility/router/primary-page-host-key';

/**
 * State for the shared page header ("page title") chrome rendered by
 * `PageTitleComponent`.
 *
 * Notes:
 * - **Hero image**: pass the full {@link File} so the component can choose the
 *   best thumbnail size via CSS media queries.
 * - **Hero focus**: vertical focus is derived from `image.focusY` and mapped to
 *   inline `background-position` styles via `imageFocusBackgroundStyles(...)`.
 * - **Reset on navigation**: the service clears state when the primary routed
 *   component changes (see {@link getPrimaryPageHostKey}).
 * - **Loading skeleton**: after a page-host change, `loading` is true until the
 *   new page calls `setTitle` / `setPortraitTitle`, unless the route opts out
 *   via `data.hidePageTitle` or `data.fullscreenMap`.
 */
export interface PageTitleState {
  /** Page heading string; ignored when `template` is set. */
  title: string | null;

  /** Optional hero background image. */
  image: File | null;

  /**
   * When true and `image` is null, the component shows a static default hero
   * background (e.g. instance default / app fallback).
   */
  heroDefaultBg: boolean;

  /** Inline styles used for image focus (typically `background-position`). */
  imageBackgroundStyles: Record<string, string> | null;

  /** Optional heading template (takes precedence over `title`). */
  template: TemplateRef<unknown> | null;

  /** Breadcrumb items for the header. */
  breadcrumbs: MenuItem[] | null;
  breadcrumbHome: MenuItem | null;

  /** Optional tab menu displayed in the header. */
  tabs: MenuItem[] | null;

  /**
   * When true, the page header shows a loading skeleton instead of real chrome
   * (reserves height to avoid content jump after async title setup).
   */
  loading: boolean;

  /**
   * When `loading` is true, prefer a hero-sized skeleton (from the previous
   * page’s hero chrome when available).
   */
  loadingHero: boolean;
}

/** Options for `setTitle(...)`. */
export interface SetPageTitleOptions {
  /** Optional hero background image. */
  image?: File | null;
  /**
   * Show the default hero background even without an image.
   * (Typically used when there *should* be a hero area but no image is set.)
   */
  heroDefaultBg?: boolean;
  /** Optional heading template; overrides the `title` string. */
  template?: TemplateRef<unknown> | null;
}

const initialState: PageTitleState = {
  title: null,
  image: null,
  heroDefaultBg: false,
  imageBackgroundStyles: null,
  template: null,
  breadcrumbs: null,
  breadcrumbHome: null,
  tabs: null,
  loading: false,
  loadingHero: false,
};

@Injectable({
  providedIn: 'root',
})
export class PageTitleService {
  private readonly stateSubject = new BehaviorSubject<PageTitleState>({
    ...initialState,
  });

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private currentPageHostKey = '';

  readonly state$ = this.stateSubject.asObservable();

  constructor() {
    // Track the current "page host" route so we can clear header state when the
    // primary routed component changes (avoids leaking breadcrumbs/tabs/title
    // between unrelated pages).
    this.currentPageHostKey = getPrimaryPageHostKey(
      this.router.routerState.snapshot.root,
    );

    this.router.events
      .pipe(
        filter((event) => event instanceof RoutesRecognized),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const recognized = event as RoutesRecognized;
        const nextPageHostKey = getPrimaryPageHostKey(recognized.state.root);
        if (nextPageHostKey !== this.currentPageHostKey) {
          if (routeHidesPageTitle(recognized.state.root)) {
            this.reset();
          } else {
            this.beginLoading(recognized.state.root);
          }
        }
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPageHostKey = getPrimaryPageHostKey(
          this.router.routerState.snapshot.root,
        );
      });
  }

  /**
   * Sets the current page header title/chrome and resets all other state to the
   * defaults.
   *
   * Prefer this over patching when navigating between unrelated pages.
   */
  setTitle(title: string | null, options?: SetPageTitleOptions): void {
    const image = options?.image ?? null;
    this.stateSubject.next({
      ...initialState,
      title,
      image,
      heroDefaultBg: options?.heroDefaultBg ?? false,
      imageBackgroundStyles: imageFocusBackgroundStyles(image?.focusY) || null,
      template: options?.template ?? null,
    });
  }

  /**
   * Sets a header title with a portrait-style hero image. If no image is
   * available, a default hero background is enabled.
   */
  setPortraitTitle(
    title: string,
    portraitImage?: File | null,
    fallbackImage?: File | null,
  ): void {
    const image = resolvePageTitleImage(portraitImage, fallbackImage);
    this.setTitle(title, {
      image,
      heroDefaultBg: !image,
    });
  }

  /**
   * Updates breadcrumbs without resetting the whole page-title state.
   * Useful when breadcrumbs depend on async-loaded entities.
   */
  setBreadcrumbs(
    breadcrumbs: MenuItem[] | null,
    home: MenuItem | null = null,
  ): void {
    this.patch({
      breadcrumbs,
      breadcrumbHome: home,
    });
  }

  setTabs(tabs: MenuItem[] | null): void {
    this.patch({ tabs });
  }

  /**
   * Clears header chrome without showing a loading skeleton.
   * Used for routes that intentionally have no page header.
   */
  reset(): void {
    this.stateSubject.next({ ...initialState });
  }

  private beginLoading(nextRoot: ActivatedRouteSnapshot): void {
    const prev = this.stateSubject.value;
    const prevHero = !!prev.image || !!prev.heroDefaultBg || !!prev.loadingHero;
    const destinationHero = routePrefersHeroTitle(nextRoot);
    // Prefer the destination hint so skeleton height matches the page that will
    // load; fall back to the previous chrome when the route has no hint.
    const loadingHero = destinationHero ?? prevHero;
    this.stateSubject.next({
      ...initialState,
      loading: true,
      loadingHero,
    });
  }

  private patch(partial: Partial<PageTitleState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...partial,
    });
  }
}

/**
 * True when the navigated route tree opts out of page-header chrome
 * (`hidePageTitle` or fullscreen map).
 */
export function routeHidesPageTitle(root: ActivatedRouteSnapshot): boolean {
  return (
    primaryRouteDataFlag(root, 'hidePageTitle') ||
    primaryRouteDataFlag(root, 'fullscreenMap')
  );
}

/**
 * Whether the destination page host expects a hero-sized header.
 * Returns `null` when the route does not declare a preference.
 */
export function routePrefersHeroTitle(
  root: ActivatedRouteSnapshot,
): boolean | null {
  let route: ActivatedRouteSnapshot | null = root;
  let found: boolean | null = null;
  while (route) {
    const data = route.data ?? {};
    if (Object.prototype.hasOwnProperty.call(data, 'pageTitleHero')) {
      found = data['pageTitleHero'] === true;
    }
    route =
      route.children.find((child) => child.outlet === PRIMARY_OUTLET) ?? null;
  }
  return found;
}

function primaryRouteDataFlag(
  root: ActivatedRouteSnapshot,
  key: string,
): boolean {
  let route: ActivatedRouteSnapshot | null = root;
  while (route) {
    const data = route.data ?? {};
    if (data[key] === true) {
      return true;
    }
    route =
      route.children.find((child) => child.outlet === PRIMARY_OUTLET) ?? null;
  }
  return false;
}

/**
 * Resolves the hero image to use (prefer primary, otherwise fallback).
 *
 * Returning the full {@link File} allows responsive thumbnail selection in CSS.
 */
export function resolvePageTitleImage(
  primaryImage?: File | null,
  fallbackImage?: File | null,
): File | null {
  if (primaryImage) {
    return primaryImage;
  }
  if (fallbackImage) {
    return fallbackImage;
  }
  return null;
}

/** Convenience helper for topo-based pages. */
export function resolveTopoPageTitleImage(
  topoImage?: TopoImage | null,
  fallbackImage?: File | null,
): File | null {
  return resolvePageTitleImage(topoImage?.image, fallbackImage);
}
