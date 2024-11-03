import { Component, OnInit } from '@angular/core';
import { CragsService } from '../../../services/crud/crags.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Crag } from '../../../models/crag';
import { MenuItem } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { selectIsModerator } from '../../../ngrx/selectors/auth.selectors';
import { Title } from '@angular/platform-browser';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { RegionService } from '../../../services/crud/region.service';

@Component({
  selector: 'lc-crag',
  templateUrl: './crag.component.html',
  styleUrls: ['./crag.component.scss'],
})
@UntilDestroy()
export class CragComponent implements OnInit {
  public crag: Crag;
  public items: MenuItem[];
  public breadcrumbs: MenuItem[] | undefined;
  public breadcrumbHome: MenuItem | undefined;

  constructor(
    private cragsService: CragsService,
    private regionService: RegionService,
    private translocoService: TranslocoService,
    private router: Router,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      this.crag = null;
      const cragSlug = params.get('crag-slug');

      const getCrag = cragSlug != '_default' ? this.cragsService.getCrag(cragSlug).pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        }),
      ) : forkJoin([
        this.regionService.getRegion(),
        this.cragsService.getCrag(cragSlug)
      ]).pipe(
        map(([region, crag]) => {
          // Merge region and crag
          crag.name = region.name;
          return crag;
        })
      );
      forkJoin([
        getCrag,
        this.store.pipe(select(selectIsModerator), take(1)),
        this.translocoService.load(`${environment.language}`),
      ]).subscribe(([crag, isModerator]) => {
        this.crag = crag;
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(`${crag.name} - ${instanceName}`);
        });
        this.items = [
          {
            label: this.translocoService.translate(marker('crag.infos')),
            icon: 'pi pi-fw pi-info-circle',
            routerLink: `/topo/${this.crag.slug}`,
            routerLinkActiveOptions: { exact: true },
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
          },
          {
            label: this.translocoService.translate(marker('crag.lines')),
            icon: 'pi pi-fw pi-chart-line',
            routerLink: `/topo/${this.crag.slug}/lines`,
          },
          // {
          //   label: this.translocoService.translate(marker('crag.gallery')),
          //   icon: 'pi pi-fw pi-images',
          //   routerLink: `/topo/${this.crag.slug}/gallery`,
          // },
          {
            label: this.translocoService.translate(marker('crag.ascents')),
            icon: 'pi pi-fw pi-check-square',
            routerLink: `/topo/${this.crag.slug}/ascents`,
          },
          {
            label: this.translocoService.translate(marker('crag.ranking')),
            icon: 'pi pi-fw pi-trophy',
            routerLink: `/topo/${this.crag.slug}/ranking`,
          },
          {
            label: this.translocoService.translate(marker('crag.edit')),
            icon: 'pi pi-fw pi-file-edit',
            routerLink: `/topo/${this.crag.slug}/edit`,
            visible: isModerator,
          },
        ];
        this.breadcrumbs = [
          {
            label: crag.name,
            routerLink: `/topo/${crag.slug}`,
          },
        ];
        this.breadcrumbHome = { icon: 'pi pi-map', routerLink: '/topo' };
      });
    });
  }
}
