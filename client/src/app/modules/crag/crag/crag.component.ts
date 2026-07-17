import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CragsService } from '../../../services/crud/crags.service';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Crag } from '../../../models/crag';
import { MenuItem } from 'primeng/api';
import { TRANSLOCO_SCOPE, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { EMPTY, forkJoin, throwError } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { selectIsModerator } from '../../../ngrx/selectors/auth.selectors';
import { Title } from '@angular/platform-browser';

import {
  selectGymMode,
  selectInstanceSettingsState,
  selectBgImage,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BlocWeatherService } from '../../../services/crud/blocweather.service';
import { LanguageService } from '../../../services/core/language.service';
import { PageTitleService } from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-crag',
  templateUrl: './crag.component.html',
  styleUrls: ['./crag.component.scss'],
  imports: [ClosedSpotTagComponent, SecretSpotTagComponent, RouterOutlet],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'crag' }],
})
export class CragComponent implements OnInit {
  public crag: Crag;
  public items: MenuItem[];

  private breadcrumbHome: MenuItem | undefined;

  private destroyRef = inject(DestroyRef);
  private cragsService = inject(CragsService);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private blocWeatherService = inject(BlocWeatherService);
  private pageTitleService = inject(PageTitleService);
  private hasBlocweather = false;

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.crag = null;
        const cragSlug = params.get('crag-slug');

        forkJoin([
          this.cragsService.getCrag(cragSlug).pipe(
            catchError((e) => {
              if (e.status === 404 || e.status === 401) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          ),
          this.store.pipe(select(selectIsModerator), take(1)),
          this.store.pipe(select(selectGymMode), take(1)),
          this.blocWeatherService.getNearest('crag', cragSlug),
          this.store.pipe(select(selectBgImage), take(1)),
        ]).subscribe(
          ([crag, isModerator, isGymMode, blocweatherConfig, bgImage]) => {
            this.hasBlocweather = !!blocweatherConfig;
            this.crag = crag;
            this.pageTitleService.setPortraitTitle(
              crag.name,
              crag.portraitImage,
              bgImage,
            );
            this.store
              .select(selectInstanceSettingsState)
              .subscribe((instanceSettings) => {
                this.title.setTitle(
                  `${crag.name} - ${instanceSettings.instanceName}`,
                );
                this.breadcrumbHome = {
                  icon: 'pi pi-map',
                  routerLink:
                    '/topo' +
                    `/${environment.skippedSlug}`.repeat(
                      instanceSettings.skippedHierarchyLayers,
                    ),
                };
                this.updateBreadcrumbs(crag);
              });
            this.buildItems(crag, isModerator, isGymMode);
            this.languageService.renderedLanguage$
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((rendered) => {
                if (!rendered) return;
                this.buildItems(crag, isModerator, isGymMode);
              });
          },
        );
      });
  }

  private updateBreadcrumbs(crag: Crag) {
    if (crag.slug === environment.skippedSlug) {
      this.pageTitleService.setBreadcrumbs(null);
      return;
    }
    this.pageTitleService.setBreadcrumbs(
      [
        {
          label: crag.name,
          routerLink: `/topo/${crag.slug}`,
        },
      ],
      this.breadcrumbHome ?? null,
    );
  }

  private buildItems(crag: Crag, isModerator: boolean, isGymMode: boolean) {
    this.items = [
      {
        label: this.translocoService.translate(marker('crag.infos')),
        icon: 'pi pi-fw pi-info-circle',
        routerLink: `/topo/${this.crag.slug}`,
        routerLinkActiveOptions: { exact: true },
        visible: true,
      },
      {
        label: this.translocoService.translate(marker('crag.rules')),
        icon: 'pi pi-fw pi-exclamation-triangle',
        routerLink: `/topo/${this.crag.slug}/rules`,
        visible: crag.rules !== null,
      },
      {
        label: this.translocoService.translate(marker('crag.sectors')),
        icon: 'pi pi-fw pi-sitemap',
        routerLink: `/topo/${this.crag.slug}/sectors`,
        visible: true,
      },
      {
        label: this.translocoService.translate(marker('crag.lines')),
        icon: 'pi pi-fw pi-chart-line',
        routerLink: `/topo/${this.crag.slug}/lines`,
        visible: true,
      },
      {
        label: this.translocoService.translate(marker('crag.ascents')),
        icon: 'pi pi-fw pi-check-square',
        routerLink: `/topo/${this.crag.slug}/ascents`,
        visible: true,
        badge: this.tabBadge(crag.ascentCount),
      },
      {
        label: this.translocoService.translate(marker('crag.ranking')),
        icon: 'pi pi-fw pi-trophy',
        routerLink: `/topo/${this.crag.slug}/ranking`,
        visible: true,
      },
      {
        label: this.translocoService.translate(marker('crag.gallery')),
        icon: 'pi pi-fw pi-images',
        routerLink: `/topo/${this.crag.slug}/gallery`,
        visible: true,
        badge: this.tabBadge(crag.imageCount),
      },
      {
        label: this.translocoService.translate(marker('crag.comments')),
        icon: 'pi pi-fw pi-comments',
        routerLink: `/topo/${this.crag.slug}/comments`,
        visible: true,
        badge: this.tabBadge(crag.commentCount),
      },
      {
        label: this.translocoService.translate(marker('crag.weather')),
        icon: 'pi pi-fw pi-sun',
        routerLink: `/topo/${this.crag.slug}/weather`,
        visible: this.hasBlocweather && !isGymMode,
      },
      {
        label: this.translocoService.translate(marker('crag.tasks')),
        icon: 'pi pi-fw pi-list-check',
        routerLink: `/topo/${this.crag.slug}/moderator-tasks`,
        visible: isModerator,
      },
      {
        label: this.translocoService.translate(marker('crag.edit')),
        icon: 'pi pi-fw pi-file-edit',
        routerLink: `/topo/${this.crag.slug}/edit`,
        visible: isModerator,
      },
    ];
    this.pageTitleService.setTabs(this.items);
  }

  private tabBadge(count: number): string {
    return String(count);
  }

  protected readonly environment = environment;
}
