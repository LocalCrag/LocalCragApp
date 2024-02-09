import { Component } from '@angular/core';
import {Crag} from '../../../models/crag';
import {Sector} from '../../../models/sector';
import {Area} from '../../../models/area';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../../services/crud/crags.service';
import {SectorsService} from '../../../services/crud/sectors.service';
import {AreasService} from '../../../services/crud/areas.service';
import {TranslocoService} from '@ngneat/transloco';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {forkJoin, of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Line} from '../../../models/line';
import {LinesService} from '../../../services/crud/lines.service';

@Component({
  selector: 'lc-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss']
})
export class LineComponent {

  public crag: Crag;
  public sector: Sector;
  public area: Area;
  public line: Line;
  public items: MenuItem[];
  public breadcrumbs: MenuItem[] | undefined;
  public breadcrumbHome: MenuItem | undefined;

  constructor(private cragsService: CragsService,
              private sectorsService: SectorsService,
              private areasService: AreasService,
              private linesService: LinesService,
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
    const lineSlug = this.route.snapshot.paramMap.get('line-slug');
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
      this.linesService.getLine(lineSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })),
      this.store.pipe(select(selectIsLoggedIn), take(1)),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([crag, sector, area, line, isLoggedIn]) => {
      this.crag = crag;
      this.sector = sector;
      this.area = area;
      this.line = line;
      this.title.setTitle(`${crag.name} / ${sector.name} / ${area.name} / ${line.name} - ${environment.instanceName}`)
      this.items = [
        {
          label: this.translocoService.translate(marker('line.infos')),
          icon: 'pi pi-fw pi-info-circle',
          routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}`,
          routerLinkActiveOptions: {exact: true}
        },
        {
          label: this.translocoService.translate(marker('line.gallery')),
          icon: 'pi pi-fw pi-images',
          routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/gallery`,
        },
        {
          label: this.translocoService.translate(marker('line.ascents')),
          icon: 'pi pi-fw pi-users',
          routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/ascents`,
        },
        {
          label: this.translocoService.translate(marker('line.edit')),
          icon: 'pi pi-fw pi-file-edit',
          routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/edit`,
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
          routerLink: `/topo/${crag.slug}/${sector.slug}/${area.slug}/lines`
        },
        {
          label: `${line.name} ${line.grade.name}`,
        },
      ];
      this.breadcrumbHome = {icon: 'pi pi-map', routerLink: '/topo'};
    })
  }

}
