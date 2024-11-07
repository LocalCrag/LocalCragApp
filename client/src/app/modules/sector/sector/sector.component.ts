import { Component, OnInit } from '@angular/core';
import { Crag } from '../../../models/crag';
import { MenuItem } from 'primeng/api';
import { CragsService } from '../../../services/crud/crags.service';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@Component({
  selector: 'lc-sector',
  templateUrl: './sector.component.html',
  styleUrls: ['./sector.component.scss'],
})
@UntilDestroy()
export class SectorComponent implements OnInit {
  public crag: Crag;
  public sector: Sector;
  public items: MenuItem[];
  public breadcrumbs: MenuItem[] | undefined;
  public breadcrumbHome: MenuItem | undefined;

  constructor(
    private cragsService: CragsService,
    private sectorsService: SectorsService,
    private translocoService: TranslocoService,
    private router: Router,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
      const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');

      forkJoin([
        this.cragsService.getCrag(cragSlug).pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        ),
        this.sectorsService.getSector(sectorSlug).pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        ),
        this.store.pipe(select(selectIsLoggedIn), take(1)),
        this.translocoService.load(`${environment.language}`),
      ]).subscribe(([crag, sector, isLoggedIn]) => {
        this.crag = crag;
        this.sector = sector;
        this.store.select(selectInstanceSettingsState).subscribe((instanceSettings) => {
          this.title.setTitle(cragSlug != environment.skippedSlug
            ? `${sector.name} / ${crag.name} - ${instanceSettings.instanceName}`
            : `${sector.name} - ${instanceSettings.instanceName}`,
          );
          this.breadcrumbHome = { icon: 'pi pi-map', routerLink: '/topo' + `/${environment.skippedSlug}`.repeat(instanceSettings.skippedHierarchyLayers) };
        });
        this.items = [
          {
            label: this.translocoService.translate(marker('sector.infos')),
            icon: 'pi pi-fw pi-info-circle',
            routerLink: `/topo/${this.crag.slug}/${this.sector.slug}`,
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: this.translocoService.translate(marker('sector.rules')),
            icon: 'pi pi-fw pi-exclamation-triangle',
            routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/rules`,
            visible: sector.rules !== null,
          },
          {
            label: this.translocoService.translate(marker('sector.areas')),
            icon: 'pi pi-fw pi-sitemap',
            routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/areas`,
          },
          {
            label: this.translocoService.translate(marker('sector.lines')),
            icon: 'pi pi-fw pi-chart-line',
            routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/lines`,
          },
          // {
          //   label: this.translocoService.translate(marker('sector.gallery')),
          //   icon: 'pi pi-fw pi-images',
          //   routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/gallery`,
          // },
          {
            label: this.translocoService.translate(marker('sector.ascents')),
            icon: 'pi pi-fw pi-check-square',
            routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/ascents`,
          },
          {
            label: this.translocoService.translate(marker('sector.ranking')),
            icon: 'pi pi-fw pi-trophy',
            routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/ranking`,
          },
          {
            label: this.translocoService.translate(marker('sector.edit')),
            icon: 'pi pi-fw pi-file-edit',
            routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/edit`,
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
          },
        ].filter(menuItem => menuItem.slug != environment.skippedSlug);
      });
    });
  }

  protected readonly environment = environment;
}
