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

export interface PageTitleState {
  title: string | null;
  imageUrl: string | null;
  imageBackgroundStyles: Record<string, string> | null;
  template: TemplateRef<unknown> | null;
  breadcrumbs: MenuItem[] | null;
  breadcrumbHome: MenuItem | null;
  tabs: MenuItem[] | null;
}

export interface SetPageTitleOptions {
  imageUrl?: string | null;
  focusY?: number | null;
  template?: TemplateRef<unknown> | null;
}

const initialState: PageTitleState = {
  title: null,
  imageUrl: null,
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

  setTitle(title: string | null, options?: SetPageTitleOptions): void {
    this.stateSubject.next({
      ...initialState,
      title,
      imageUrl: options?.imageUrl ?? null,
      imageBackgroundStyles:
        imageFocusBackgroundStyles(options?.focusY) || null,
      template: options?.template ?? null,
    });
  }

  setPortraitTitle(
    title: string,
    portraitImage?: File | null,
    fallbackImage?: File | null,
  ): void {
    const hero = resolveHeroImage(portraitImage, fallbackImage);
    this.setTitle(title, {
      imageUrl: hero.url,
      focusY: hero.focusY,
    });
  }

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

export function portraitImageUrl(
  portraitImage?: File | null,
  fallbackImage?: File | null,
): string | null {
  return resolveHeroImage(portraitImage, fallbackImage).url;
}

export function topoImageHeaderUrl(
  topoImage?: TopoImage | null,
  fallbackImage?: File | null,
): string | null {
  return resolveHeroImage(topoImage?.image, fallbackImage).url;
}

export function topoImageHeaderFocusY(
  topoImage?: TopoImage | null,
  fallbackImage?: File | null,
): number | null {
  return resolveHeroImage(topoImage?.image, fallbackImage).focusY;
}

function resolveHeroImage(
  primaryImage?: File | null,
  fallbackImage?: File | null,
): { url: string | null; focusY: number | null } {
  if (primaryImage) {
    return {
      url: fileImageUrl(primaryImage) ?? heroImageUrl(primaryImage),
      focusY: primaryImage.focusY,
    };
  }
  if (fallbackImage) {
    return {
      url: heroImageUrl(fallbackImage),
      focusY: fallbackImage.focusY,
    };
  }
  return { url: null, focusY: null };
}

function fileImageUrl(file?: File | null): string | null {
  if (!file) {
    return null;
  }
  return file.thumbnailL ?? file.thumbnailM ?? file.path ?? null;
}

function heroImageUrl(file?: File | null): string | null {
  if (!file) {
    return null;
  }
  return (
    file.thumbnailXL ?? file.thumbnailL ?? file.thumbnailM ?? file.path ?? null
  );
}
