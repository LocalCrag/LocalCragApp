import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { MenuItem } from 'primeng/api';
import { CragsService } from '../../../services/crud/crags.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { TRANSLOCO_SCOPE, TranslocoService } from '@jsverse/transloco';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Area } from '../../../models/area';
import { AreasService } from '../../../services/crud/areas.service';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { Card } from 'primeng/card';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { NgIf } from '@angular/common';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { SetActiveTabDirective } from '../../shared/directives/set-active-tab.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-area',
  templateUrl: './area.component.html',
  styleUrls: ['./area.component.scss'],
  imports: [
    Card,
    ClosedSpotTagComponent,
    SecretSpotTagComponent,
    NgIf,
    Breadcrumb,
    Tabs,
    SetActiveTabDirective,
    TabList,
    Tab,
    RouterLink,
    RouterOutlet,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'area' }],
})
export class AreaComponent implements OnInit {
  public crag: Crag;
  public sector: Sector;
  public area: Area;
  public items: MenuItem[];
  public breadcrumbs: MenuItem[] | undefined;
  public breadcrumbHome: MenuItem | undefined;

  private destroyRef = inject(DestroyRef);
  private cragsService = inject(CragsService);
  private sectorsService = inject(SectorsService);
  private areasService = inject(AreasService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
        const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
        const areaSlug = this.route.snapshot.paramMap.get('area-slug');
        forkJoin([
          this.cragsService.getCrag(cragSlug).pipe(
            catchError((e) => {
              if (e.status === 404 || e.status === 401) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          ),
          this.sectorsService.getSector(sectorSlug).pipe(
            catchError((e) => {
              if (e.status === 404 || e.status === 401) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          ),
          this.areasService.getArea(areaSlug).pipe(
            catchError((e) => {
              if (e.status === 404 || e.status === 401) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          ),
          this.store.pipe(select(selectIsLoggedIn), take(1)),
          this.translocoService.load(`${environment.language}`),
        ]).subscribe(([crag, sector, area, isLoggedIn]) => {
          this.crag = crag;
          this.sector = sector;
          this.area = area;
          this.store
            .select(selectInstanceSettingsState)
            .subscribe((instanceSettings) => {
              const components = [area, sector, crag]
                .filter((e) => e.slug != environment.skippedSlug)
                .map((e) => e.name);
              this.title.setTitle(
                `${components.join(' / ')} - ${instanceSettings.instanceName}`,
              );
              this.breadcrumbHome = {
                icon: 'pi pi-map',
                routerLink:
                  '/topo' +
                  `/${environment.skippedSlug}`.repeat(
                    instanceSettings.skippedHierarchyLayers,
                  ),
              };
            });
          this.items = [
            {
              label: this.translocoService.translate(marker('area.infos')),
              icon: 'pi pi-fw pi-info-circle',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}`,
              routerLinkActiveOptions: { exact: true },
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('area.topoImages')),
              icon: 'pi pi-fw pi-chart-line',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/topo-images`,
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('area.lines')),
              icon: 'pi pi-fw pi-chart-line',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/lines`,
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('area.ascents')),
              icon: 'pi pi-fw pi-check-square',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/ascents`,
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('area.gallery')),
              icon: 'pi pi-fw pi-images',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/gallery`,
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('area.edit')),
              icon: 'pi pi-fw pi-file-edit',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/edit`,
              visible: isLoggedIn,
            },
          ];
          this.breadcrumbs = [
            {
              label: crag.name,
              slug: crag.slug,
              routerLink: `/topo/${crag.slug}/sectors`,
            },
            {
              label: sector.name,
              slug: sector.slug,
              routerLink: `/topo/${crag.slug}/${sector.slug}/areas`,
            },
            {
              label: area.name,
              slug: area.slug,
            },
          ].filter((menuItem) => menuItem.slug != environment.skippedSlug);
        });
      });
  }
}
