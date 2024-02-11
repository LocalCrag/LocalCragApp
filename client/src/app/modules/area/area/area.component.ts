import {Component, OnInit} from '@angular/core';
import {Crag} from '../../../models/crag';
import {Sector} from '../../../models/sector';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../../services/crud/crags.service';
import {SectorsService} from '../../../services/crud/sectors.service';
import {TranslocoService} from '@ngneat/transloco';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {forkJoin, of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Area} from '../../../models/area';
import {AreasService} from '../../../services/crud/areas.service';

@Component({
  selector: 'lc-area',
  templateUrl: './area.component.html',
  styleUrls: ['./area.component.scss']
})
export class AreaComponent implements OnInit {

  public crag: Crag;
  public sector: Sector;
  public area: Area;
  public items: MenuItem[];
  public breadcrumbs: MenuItem[] | undefined;
  public breadcrumbHome: MenuItem | undefined;

  constructor(private cragsService: CragsService,
              private sectorsService: SectorsService,
              private areasService: AreasService,
              private translocoService: TranslocoService,
              private router: Router,
              private store: Store,
              private title: Title,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    const areaSlug = this.route.snapshot.paramMap.get('area-slug');
    forkJoin([
      this.cragsService.getCrag(cragSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })),
      this.sectorsService.getSector(sectorSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })),
      this.areasService.getArea(areaSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })),
      this.store.pipe(select(selectIsLoggedIn), take(1)),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([crag, sector, area, isLoggedIn]) => {
      this.crag = crag;
      this.sector = sector;
      this.area = area;
      this.title.setTitle(`${area.name} / ${sector.name} / ${crag.name} - ${environment.instanceName}`)
      this.items = [
        {
          label: this.translocoService.translate(marker('area.infos')),
          icon: 'pi pi-fw pi-info-circle',
          routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}`,
          routerLinkActiveOptions: {exact: true}
        },
        {
          label: this.translocoService.translate(marker('area.lines')),
          icon: 'pi pi-fw pi-sitemap',
          routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/lines`,
        },
        {
          label: this.translocoService.translate(marker('area.topoImages')),
          icon: 'pi pi-fw pi-chart-line',
          routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/topo-images`,
        },
        // {
        //   label: this.translocoService.translate(marker('area.gallery')),
        //   icon: 'pi pi-fw pi-images',
        //   routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/gallery`,
        // },
        // {
        //   label: this.translocoService.translate(marker('area.ascents')),
        //   icon: 'pi pi-fw pi-users',
        //   routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/ascents`,
        // },
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
          routerLink: `/topo/${crag.slug}/sectors`
        },
        {
          label: sector.name,
          routerLink: `/topo/${crag.slug}/${sector.slug}/areas`
        },
        {
          label: area.name,
        },
      ];
      this.breadcrumbHome = {icon: 'pi pi-map', routerLink: '/topo'};
    })
  }


}
