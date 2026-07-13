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
 *   component changes (see `getPrimaryPageHostKey(...)`).
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
    this.currentPageHostKey = this.getPrimaryPageHostKey(
      this.router.routerState.snapshot.root,
    );

    this.router.events
      .pipe(
        filter((event) => event instanceof RoutesRecognized),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const recognized = event as RoutesRecognized;
        const nextPageHostKey = this.getPrimaryPageHostKey(
          recognized.state.root,
        );
        if (nextPageHostKey !== this.currentPageHostKey) {
          this.clear();
        }
      });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPageHostKey = this.getPrimaryPageHostKey(
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

  private clear(): void {
    this.stateSubject.next({ ...initialState });
  }

  /**
   * Builds a "page host" key from the route tree.
   *
   * We treat the deepest primary-outlet route that defines a component (or
   * loadComponent) as the page host. When this key changes, we clear the header
   * state so it doesn't leak across pages.
   */
  private getPrimaryPageHostKey(root: ActivatedRouteSnapshot): string {
    let hostRoute: ActivatedRouteSnapshot | null = null;

    const visit = (route: ActivatedRouteSnapshot) => {
      if (this.routeDefinesPageHost(route)) {
        hostRoute = route;
      }

      for (const child of route.children) {
        if (child.outlet === PRIMARY_OUTLET) {
          visit(child);
        }
      }
    };

    visit(root);

    if (!hostRoute) {
      return '';
    }

    return hostRoute.pathFromRoot
      .map((segment) => segment.routeConfig?.path ?? '')
      .join('/');
  }

  private routeDefinesPageHost(route: ActivatedRouteSnapshot): boolean {
    const config = route.routeConfig;
    return !!(config?.component || config?.loadComponent);
  }

  private patch(partial: Partial<PageTitleState>): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      ...partial,
    });
  }
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
