import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Crag } from '../../../models/crag';
import { MenuItem } from 'primeng/api';
import { CragsService } from '../../../services/crud/crags.service';
import { TRANSLOCO_SCOPE, TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { EMPTY, forkJoin, throwError } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { selectIsModerator } from '../../../ngrx/selectors/auth.selectors';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
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
  selector: 'lc-sector',
  templateUrl: './sector.component.html',
  styleUrls: ['./sector.component.scss'],
  imports: [ClosedSpotTagComponent, SecretSpotTagComponent, RouterOutlet],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'sector' }],
})
export class SectorComponent implements OnInit {
  public crag: Crag;
  public sector: Sector;
  public items: MenuItem[];

  private breadcrumbHome: MenuItem | undefined;

  private destroyRef = inject(DestroyRef);
  private cragsService = inject(CragsService);
  private sectorsService = inject(SectorsService);
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
      .subscribe(() => {
        const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
        const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
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
          this.sectorsService.getSector(sectorSlug).pipe(
            catchError((e) => {
              if (e.status === 404 || e.status === 401) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          ),
          this.blocWeatherService.getNearest('sector', sectorSlug),
          this.store.pipe(select(selectIsModerator), take(1)),
          this.store.pipe(select(selectGymMode), take(1)),
          this.store.pipe(select(selectBgImage), take(1)),
        ]).subscribe(
          ([
            crag,
            sector,
            blocweatherConfig,
            isModerator,
            isGymMode,
            bgImage,
          ]) => {
            this.hasBlocweather = !!blocweatherConfig;
            this.crag = crag;
            this.sector = sector;
            this.pageTitleService.setPortraitTitle(
              sector.name,
              sector.portraitImage,
              bgImage,
            );
            this.store
              .select(selectInstanceSettingsState)
              .subscribe((instanceSettings) => {
                this.title.setTitle(
                  cragSlug != environment.skippedSlug
                    ? `${sector.name} / ${crag.name} - ${instanceSettings.instanceName}`
                    : `${sector.name} - ${instanceSettings.instanceName}`,
                );
                this.breadcrumbHome = {
                  icon: 'pi pi-map',
                  routerLink:
                    '/topo' +
                    `/${environment.skippedSlug}`.repeat(
                      instanceSettings.skippedHierarchyLayers,
                    ),
                };
                this.updateBreadcrumbs(crag, sector);
              });
            this.buildItems(isModerator, isGymMode);
            this.languageService.renderedLanguage$
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((rendered) => {
                if (!rendered) return;
                this.buildItems(isModerator, isGymMode);
              });
          },
        );
      });
  }

  private updateBreadcrumbs(crag: Crag, sector: Sector) {
    const breadcrumbs = [
      {
        label: crag.name,
        slug: crag.slug,
        routerLink: `/topo/${crag.slug}/sectors`,
      },
      {
        label: sector.name,
        slug: sector.slug,
      },
    ].filter((menuItem) => menuItem.slug != environment.skippedSlug);
    this.pageTitleService.setBreadcrumbs(
      breadcrumbs,
      this.breadcrumbHome ?? null,
    );
  }

  private buildItems(isModerator: boolean, isGymMode: boolean) {
    this.items = [
      {
        label: this.translocoService.translate(marker('sector.infos')),
        icon: 'pi pi-fw pi-info-circle',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}`,
        routerLinkActiveOptions: { exact: true },
        visible: true,
      },
      {
        label: this.translocoService.translate(marker('sector.rules')),
        icon: 'pi pi-fw pi-exclamation-triangle',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/rules`,
        visible: this.sector.rules !== null,
      },
      {
        label: this.translocoService.translate(marker('sector.areas')),
        icon: 'pi pi-fw pi-sitemap',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/areas`,
        visible: true,
        badge: this.tabBadge(this.sector.areaCount),
      },
      {
        label: this.translocoService.translate(marker('sector.lines')),
        icon: 'pi pi-fw pi-chart-line',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/lines`,
        visible: true,
        badge: this.tabBadge(this.sector.lineCount),
      },
      {
        label: this.translocoService.translate(marker('sector.ascents')),
        icon: 'pi pi-fw pi-check-square',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/ascents`,
        visible: true,
        badge: this.tabBadge(this.sector.ascentCount),
      },
      {
        label: this.translocoService.translate(marker('sector.ranking')),
        icon: 'pi pi-fw pi-trophy',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/ranking`,
        visible: true,
      },
      {
        label: this.translocoService.translate(marker('sector.gallery')),
        icon: 'pi pi-fw pi-images',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/gallery`,
        visible: true,
        badge: this.tabBadge(this.sector.imageCount),
      },
      {
        label: this.translocoService.translate(marker('sector.comments')),
        icon: 'pi pi-fw pi-comments',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/comments`,
        visible: true,
        badge: this.tabBadge(this.sector.commentCount),
      },
      {
        label: this.translocoService.translate(marker('sector.weather')),
        icon: 'pi pi-fw pi-sun',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/weather`,
        visible: this.hasBlocweather && !isGymMode,
      },
      {
        label: this.translocoService.translate(marker('sector.tasks')),
        icon: 'pi pi-fw pi-list-check',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/moderator-tasks`,
        visible: isModerator,
        badge: this.tabBadge(this.sector.taskCount ?? 0),
      },
      {
        label: this.translocoService.translate(marker('sector.edit')),
        icon: 'pi pi-fw pi-file-edit',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/edit`,
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
