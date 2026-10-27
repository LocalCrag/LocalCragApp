import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import {
  TRANSLOCO_SCOPE,
  TranslocoDirective,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { combineLatest } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { selectIsModerator } from '../../../ngrx/selectors/auth.selectors';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { LanguageService } from '../../../services/core/language.service';
import { PageTitleService } from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-topo-quality-page',
  imports: [RouterOutlet, TranslocoDirective, ToggleSwitch, FormsModule],
  templateUrl: './topo-quality-page.component.html',
  styleUrl: './topo-quality-page.component.scss',
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'topoQuality' }],
})
export class TopoQualityPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);
  private transloco = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);
  private languageService = inject(LanguageService);
  private title = inject(Title);
  private destroyRef = inject(DestroyRef);

  excludeSecret = false;
  private gameEnabled = false;
  private moderator = false;
  /**
   * setTitle replaces the whole header on a later microtask. Tabs set before
   * that land on the loading state and get wiped.
   */
  private titleReady = false;

  ngOnInit() {
    const pageTitle = this.transloco.translate(marker('menu.topoQuality'));
    // The header is already checked in this turn (loading skeleton). Applying
    // the title synchronously flips that binding and throws NG0100.
    let alive = true;
    this.destroyRef.onDestroy(() => {
      alive = false;
    });
    queueMicrotask(() => {
      if (!alive) {
        return;
      }
      this.pageTitleService.setTitle(pageTitle, { heroDefaultBg: true });
      queueMicrotask(() => {
        if (!alive) {
          return;
        }
        this.titleReady = true;
        this.syncTabs();
      });
      this.store
        .select(selectInstanceSettingsState)
        .pipe(
          filter((settings) => settings.loaded),
          take(1),
        )
        .subscribe((settings) => {
          this.title.setTitle(`${pageTitle} - ${settings.instanceName}`);
        });
    });
    combineLatest([
      this.store
        .select(selectInstanceSettingsState)
        .pipe(filter((settings) => settings.loaded)),
      this.store.select(selectIsModerator),
      this.route.queryParamMap,
      this.languageService.renderedLanguage$.pipe(
        filter((language): language is string => !!language),
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([settings, moderator, params]) => {
        this.excludeSecret = params.get('excludeSecret') === 'true';
        this.gameEnabled = settings.moderatorGameEnabled;
        this.moderator = moderator;
        this.syncTabs();
      });
  }

  rankingActive(): boolean {
    return this.router.url.includes('/topo-quality/ranking');
  }

  onExcludeSecret(value: boolean) {
    this.excludeSecret = value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { excludeSecret: value ? 'true' : null },
      queryParamsHandling: 'merge',
    });
  }

  private syncTabs() {
    if (!this.titleReady || !this.router.url.startsWith('/topo-quality')) {
      return;
    }
    if (!this.gameEnabled || !this.moderator) {
      this.pageTitleService.setTabs(null);
      return;
    }
    const queryParams = this.excludeSecret ? { excludeSecret: 'true' } : {};
    const tabs: MenuItem[] = [
      {
        label: this.transloco.translate(marker('topoQuality.ui.qualityTab')),
        icon: 'pi pi-fw pi-chart-bar',
        routerLink: '/topo-quality',
        queryParams,
        routerLinkActiveOptions: { exact: true },
        visible: true,
      },
      {
        label: this.transloco.translate(marker('topoQuality.ui.rankingTab')),
        icon: 'pi pi-fw pi-trophy',
        routerLink: '/topo-quality/ranking',
        queryParams,
        visible: true,
      },
    ];
    this.pageTitleService.setTabs(tabs);
  }
}
