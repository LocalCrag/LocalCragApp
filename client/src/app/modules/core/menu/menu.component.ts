import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  DestroyRef,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { select, Store } from '@ngrx/store';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import {
  selectAuthState,
  selectCurrentUser,
} from '../../../ngrx/selectors/auth.selectors';
import {
  cleanupCredentials,
  logout,
  newAuthCredentials,
} from 'src/app/ngrx/actions/auth.actions';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { take, map } from 'rxjs/operators';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { Actions, ofType } from '@ngrx/effects';
import { reloadMenus } from '../../../ngrx/actions/core.actions';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { MenuItemPosition } from '../../../enums/menu-item-position';
import { MenuItemType } from '../../../enums/menu-item-type';
import { Crag } from '../../../models/crag';
import {
  selectInstanceName,
  selectDarkLogoImage,
  selectLogoImage,
  selectSkippedHierarchyLayers,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { effectiveLogoImage } from '../../../utility/instance-settings-theme';
import { ThemeService } from '../../../services/core/theme.service';
import { File } from '../../../models/file';
import { User } from '../../../models/user';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';
import { environment } from '../../../../environments/environment';
import { HeaderMenuComponent } from '../../shared/components/header-menu/header-menu.component';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Menu } from 'primeng/menu';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Button } from 'primeng/button';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { LanguageSelectComponent } from '../../shared/forms/controls/language-select/language-select.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LanguageCode } from '../../../utility/types/language';
import { LanguageService } from '../../../services/core/language.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import {
  MAX_NAVBAR_COLLAPSE_LEVEL,
  NAVBAR_COLLAPSE_LEVELS,
} from './navbar-collapse';

@Component({
  selector: 'lc-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [DialogService],
  imports: [
    HeaderMenuComponent,
    AsyncPipe,
    RouterLink,
    TranslocoDirective,
    Menu,
    UserAvatarComponent,
    HasPermissionDirective,
    Button,
    FormControlDirective,
    LanguageSelectComponent,
    ReactiveFormsModule,
    FormsModule,
    NotificationBellComponent,
  ],
})
export class MenuComponent implements OnInit, AfterViewInit {
  @ViewChild(HeaderMenuComponent)
  headerMenu?: HeaderMenuComponent;

  items: MenuItem[] = [];
  userMenuItems: MenuItem[] = [];
  isMobile$: Observable<boolean>;
  logoImage$: Observable<File>;
  instanceName$: Observable<string>;
  currentUser$: Observable<User>;
  skippedHierarchyLayers$: Observable<number>;
  ref: DynamicDialogRef | undefined;
  language: LanguageCode;
  /**
   * How many optional header controls are currently hidden (0 = all visible).
   * Recomputed from scratch on resize and layout changes; see `reconcileNavbarOverflow()`.
   */
  navbarCollapseLevel = 0;

  /** Threshold constants for `showNavbarElement()` in the template. */
  readonly navbarCollapseLevels = NAVBAR_COLLAPSE_LEVELS;

  private menuItemsService = inject(MenuItemsService);
  private translocoService = inject(TranslocoService);
  private dialogService = inject(DialogService);
  private actions = inject(Actions);
  private store = inject(Store);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  readonly themeService = inject(ThemeService);
  private readonly isDarkMode$ = toObservable(this.themeService.isDarkMode);
  private navbarResizeObserver?: ResizeObserver;
  private isReconcilingNavbarOverflow = false;

  ngOnInit() {
    this.logoImage$ = combineLatest([
      this.store.select(selectLogoImage),
      this.store.select(selectDarkLogoImage),
      this.isDarkMode$,
    ]).pipe(
      map(([logo, darkLogo, isDarkMode]) =>
        effectiveLogoImage(logo, darkLogo, isDarkMode),
      ),
    );
    this.instanceName$ = this.store.pipe(select(selectInstanceName));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.currentUser$ = this.store.pipe(select(selectCurrentUser));
    this.skippedHierarchyLayers$ = this.store.select(
      selectSkippedHierarchyLayers,
    );
    this.language = this.languageService.calculatedLanguage;
    this.buildMenu();
    this.buildUserMenu();

    // Recompute menus whenever the rendered language changes.
    this.languageService.renderedLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rendered) => {
        if (!rendered) return;
        // update two-letter language selector for the UI (strip possible -gym suffix)
        this.language = rendered.split('-')[0] as LanguageCode;
        this.recomputeMenus();
      });

    // Also recompute menus when core actions update menus or auth credentials change.
    this.actions
      .pipe(
        ofType(reloadMenus, newAuthCredentials, cleanupCredentials),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((action) => {
        // Prevent loading menus if new credentials come from token refresh
        if (
          action.type === newAuthCredentials.type &&
          !action.initialCredentials
        ) {
          return;
        }
        this.recomputeMenus();
      });
  }

  ngAfterViewInit() {
    this.reconcileNavbarOverflow();
    if (!window.ResizeObserver || !this.headerMenu) {
      return;
    }
    this.navbarResizeObserver = new ResizeObserver(() => {
      this.reconcileNavbarOverflow();
    });
    this.navbarResizeObserver.observe(
      this.headerMenu.elementRef.nativeElement as HTMLElement,
    );
    this.destroyRef.onDestroy(() => this.navbarResizeObserver?.disconnect());
  }

  @HostListener('window:resize')
  onWindowResize() {
    this.reconcileNavbarOverflow();
  }

  /** Whether an optional header control should render at the current collapse level. */
  showNavbarElement(threshold: number): boolean {
    return this.navbarCollapseLevel < threshold;
  }

  /**
   * Fits the top navigation to the available width using a two-stage collapse strategy.
   *
   * **Stage 1 — link menu:** Try the full horizontal link menu first
   * (`overflowDetected = false`). If the menubar overflows, collapse the dynamic
   * nav links into the burger menu (`overflowDetected = true`). This frees horizontal
   * space without hiding search, logo, or other end-slot controls.
   *
   * **Stage 2 — optional controls:** If the menubar still overflows with the burger
   * menu, increase `navbarCollapseLevel` one step at a time, hiding elements in the
   * order defined by {@link NAVBAR_COLLAPSE_LEVELS}: theme toggle → language select →
   * notifications → search → logo.
   *
   * Each pass starts from the most expanded state so controls reappear automatically
   * when the viewport grows. A `ResizeObserver` on the menubar and window resize
   * events trigger reconciliation; auth and menu model changes schedule a pass as well.
   *
   * Projected start/end template content lives in this component, so collapse state
   * and change detection are owned here rather than in `HeaderMenuComponent`.
   */
  private reconcileNavbarOverflow() {
    if (!this.headerMenu || this.isReconcilingNavbarOverflow) {
      return;
    }

    this.isReconcilingNavbarOverflow = true;
    try {
      // Stage 1a: prefer the full horizontal link menu with all controls visible.
      this.navbarCollapseLevel = 0;
      this.headerMenu.setOverflowDetected(false);
      this.cdr.detectChanges();

      if (!this.headerMenu.isOverflowing()) {
        return;
      }

      // Stage 1b: collapse nav links into the burger menu.
      this.headerMenu.setOverflowDetected(true);
      this.cdr.detectChanges();

      // Stage 2: hide optional controls one by one until the menubar fits.
      while (
        this.headerMenu.isOverflowing() &&
        this.navbarCollapseLevel < MAX_NAVBAR_COLLAPSE_LEVEL
      ) {
        this.navbarCollapseLevel++;
        this.cdr.detectChanges();
      }
    } finally {
      this.isReconcilingNavbarOverflow = false;
    }
  }

  /**
   * Recompute both the main and user menus.
   */
  private recomputeMenus() {
    this.buildMenu();
    this.buildUserMenu();
  }

  updateLanguage(language: LanguageCode) {
    this.language = language;
    this.languageService.setPreferredLanguage(language);
  }

  toggleGuestColorScheme(): void {
    this.themeService.toggleGuestColorScheme();
  }

  buildUserMenu() {
    this.store
      .select(selectAuthState)
      .pipe(take(1))
      .subscribe((authState) => {
        if (authState.user) {
          const items: MenuItem[] = [];

          // Only add the system category for moderators
          if (authState.user.moderator) {
            items.push({
              label: this.translocoService.translate(
                marker('menu.systemCategory'),
              ),
              items: [
                {
                  icon: 'pi pi-fw pi-file',
                  label: this.translocoService.translate(
                    marker('menu.menuPages'),
                  ),
                  routerLink: '/pages',
                },
                {
                  icon: 'pi pi-fw pi-bars',
                  label: this.translocoService.translate(marker('menu.menus')),
                  routerLink: '/menu-items',
                },
                {
                  icon: 'pi pi-fw pi-users',
                  label: this.translocoService.translate(marker('menu.users')),
                  routerLink: '/users',
                  routerLinkActiveOptions: { exact: true },
                },
                {
                  icon: 'pi pi-fw pi-sliders-h',
                  label: this.translocoService.translate(marker('menu.scales')),
                  routerLink: '/scales',
                },
                {
                  icon: 'pi pi-fw pi-cog',
                  label: this.translocoService.translate(
                    marker('menu.instanceSettings'),
                  ),
                  routerLink: '/instance-settings',
                },
              ],
            });
          }

          // Account category is always present
          items.push({
            label: this.translocoService.translate(
              marker('menu.accountCategory'),
            ),
            items: [
              {
                icon: 'pi pi-fw pi-user',
                label: this.translocoService.translate(
                  marker('menu.accountDetail'),
                ),
                routerLink: `/users/${authState.user.slug}`,
              },
              {
                icon: 'pi pi-fw pi-check-circle',
                label: this.translocoService.translate(marker('menu.todos')),
                routerLink: `/todos`,
              },
              {
                icon: 'pi pi-fw pi-user-edit',
                label: this.translocoService.translate(marker('menu.account')),
                routerLink: '/account',
              },
              {
                icon: 'pi pi-fw pi-shield',
                label: this.translocoService.translate(
                  marker('menu.changePassword'),
                ),
                routerLink: '/change-password',
              },
              {
                label: this.translocoService.translate(marker('menu.logout')),
                icon: 'pi pi-fw pi-sign-out',
                command: this.logout.bind(this),
              },
            ],
          });

          // If the only group present is the account category, unwrap it so
          // the p-menu receives a flat list of MenuItem entries instead of
          // a single grouped object with a label.
          if (items.length === 1 && Array.isArray(items[0].items)) {
            this.userMenuItems = items[0].items as MenuItem[];
          } else {
            this.userMenuItems = items;
          }
        }
        queueMicrotask(() => this.reconcileNavbarOverflow());
      });
  }

  buildMenu() {
    forkJoin([
      this.menuItemsService.getMenuItems(),
      this.menuItemsService.getCragMenuStructure(),
      this.skippedHierarchyLayers$.pipe(take(1)),
    ]).subscribe(([menuItems, crags, skippedHierarchyLayers]) => {
      const skippedHierarchyLayersSlug = `${environment.skippedSlug}/`.repeat(
        skippedHierarchyLayers,
      );
      const items: MenuItem[] = [];
      const menuItemsTop = menuItems.filter(
        (menuItem) => menuItem.position === MenuItemPosition.TOP,
      );
      menuItemsTop.forEach((menuItem) => {
        switch (menuItem.type) {
          case MenuItemType.MENU_PAGE:
            items.push({
              label: menuItem.menuPage.title,
              icon: `pi pi-fw ${menuItem.icon}`,
              routerLink: '/pages/' + menuItem.menuPage.slug,
            });
            break;
          case MenuItemType.NEWS:
            items.push({
              label: this.translocoService.translate(marker('menu.news')),
              icon: 'pi pi-fw pi-megaphone',
              routerLink: '/news',
            });
            break;
          case MenuItemType.URL:
            items.push({
              label: menuItem.title,
              url: menuItem.url,
              icon: `pi pi-fw ${menuItem.icon}`,
            });
            break;
          case MenuItemType.TOPO:
            items.push({
              label: this.translocoService.translate(marker('menu.topo')),
              icon: 'pi pi-fw pi-map',
              routerLink: '/topo/crags',
              items: this.buildCragNavigationMenu(crags),
            });
            break;
          case MenuItemType.ASCENTS:
            items.push({
              label: this.translocoService.translate(marker('menu.ascents')),
              icon: 'pi pi-fw pi-check-square',
              routerLink: '/ascents',
            });
            break;
          case MenuItemType.RANKING:
            items.push({
              label: this.translocoService.translate(marker('menu.ranking')),
              icon: 'pi pi-fw pi-trophy',
              routerLink: '/ranking',
            });
            break;
          case MenuItemType.GALLERY:
            items.push({
              label: this.translocoService.translate(marker('menu.gallery')),
              icon: 'pi pi-fw pi-images',
              routerLink: `/topo/${skippedHierarchyLayersSlug}gallery`,
            });
            break;
          case MenuItemType.HISTORY:
            items.push({
              label: this.translocoService.translate(marker('menu.history')),
              icon: 'pi pi-fw pi-clock',
              routerLink: '/history',
            });
            break;
        }
      });
      this.items = items;
      queueMicrotask(() => this.reconcileNavbarOverflow());
    });
  }

  buildCragNavigationMenu(crags: Crag[]) {
    let cragItems = [];
    crags.map((crag) => {
      cragItems.push({
        label: crag.name,
        routerLink: `/topo/${crag.slug}/sectors`,
        slug: crag.slug,
        items: crag.sectors.map((sector) => {
          return {
            label: sector.name,
            routerLink: `/topo/${crag.slug}/${sector.slug}/areas`,
            slug: sector.slug,
            items: sector.areas.map((area) => {
              return {
                label: area.name,
                slug: area.slug,
                routerLink: `/topo/${crag.slug}/${sector.slug}/${area.slug}/topo-images`,
              };
            }),
          };
        }),
      });
    });
    while (
      cragItems.length > 0 &&
      cragItems[0].slug == environment.skippedSlug
    ) {
      // Pop skippedSlug items
      cragItems = cragItems[0].items;
    }
    return cragItems;
  }

  /**
   * Logs out the user.
   */
  logout() {
    this.store.dispatch(logout({ isAutoLogout: false, silent: false }));
  }

  openSearch() {
    this.ref = this.dialogService.open(SearchDialogComponent, {
      position: 'top',
      closeOnEscape: true,
      dismissableMask: true,
      modal: true,
      showHeader: false,
      styleClass: 'search-dialog',
    });
  }
}
