import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { MenuItem } from 'primeng/api';
import { CragsService } from '../../../services/crud/crags.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { AreasService } from '../../../services/crud/areas.service';
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
import { selectIsModerator } from '../../../ngrx/selectors/auth.selectors';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Line } from '../../../models/line';
import { LinesService } from '../../../services/crud/lines.service';
import {
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ScalesService } from '../../../services/crud/scales.service';
import { Card } from 'primeng/card';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { NgIf } from '@angular/common';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { SetActiveTabDirective } from '../../shared/directives/set-active-tab.directive';

@Component({
  selector: 'lc-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    Card,
    LineGradePipe,
    ClosedSpotTagComponent,
    NgIf,
    SecretSpotTagComponent,
    Breadcrumb,
    Tabs,
    SetActiveTabDirective,
    TabList,
    Tab,
    RouterLink,
    RouterOutlet,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'line' }],
})
@UntilDestroy()
export class LineComponent implements OnInit {
  public crag: Crag;
  public sector: Sector;
  public area: Area;
  public line: Line;
  public items: MenuItem[];
  public breadcrumbs: MenuItem[] | undefined;
  public breadcrumbHome: MenuItem | undefined;

  constructor(
    private cragsService: CragsService,
    private sectorsService: SectorsService,
    private areasService: AreasService,
    private linesService: LinesService,
    private translocoService: TranslocoService,
    private router: Router,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
    protected scalesService: ScalesService,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
      const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
      const areaSlug = this.route.snapshot.paramMap.get('area-slug');
      const lineSlug = this.route.snapshot.paramMap.get('line-slug');
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
        this.linesService.getLine(lineSlug).pipe(
          catchError((e) => {
            if (e.status === 404 || e.status === 401) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        ),
        this.store.pipe(select(selectIsModerator), take(1)),
        this.store.pipe(select(selectInstanceSettingsState), take(1)),
        this.translocoService.load(`${environment.language}`),
      ]).subscribe(
        ([crag, sector, area, line, isModerator, instanceSettings]) => {
          this.crag = crag;
          this.sector = sector;
          this.area = area;
          this.line = line;
          const gradeValue = instanceSettings.displayUserGradesRatings
            ? line.userGradeValue
            : line.authorGradeValue;
          this.scalesService
            .gradeNameByValue(line.type, line.gradeScale, gradeValue)
            .subscribe((gradeName) => {
              this.breadcrumbs = [
                {
                  label: crag.name,
                  routerLink: `/topo/${crag.slug}/sectors`,
                },
                {
                  label: sector.name,
                  routerLink: `/topo/${crag.slug}/${sector.slug}/areas`,
                },
                {
                  label: area.name,
                  routerLink: `/topo/${crag.slug}/${sector.slug}/${area.slug}/topo-images`,
                },
                {
                  label: `${line.name} ${gradeValue > 0 ? gradeName : this.translocoService.translate(gradeName)}`,
                },
              ];

              this.store
                .select(selectInstanceName)
                .subscribe((instanceName) => {
                  this.title.setTitle(
                    `${line.name} ${gradeValue > 0 ? gradeName : this.translocoService.translate(gradeName)} / ${area.name} / ${sector.name} / ${crag.name} - ${instanceName}`,
                  );
                });
            });

          this.items = [
            {
              label: this.translocoService.translate(marker('line.infos')),
              icon: 'pi pi-fw pi-info-circle',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}`,
              routerLinkActiveOptions: { exact: true },
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('line.ascents')),
              icon: 'pi pi-fw pi-check-square',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/ascents`,
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('line.gallery')),
              icon: 'pi pi-fw pi-images',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/gallery`,
              visible: true,
            },
            {
              label: this.translocoService.translate(marker('line.edit')),
              icon: 'pi pi-fw pi-file-edit',
              routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/edit`,
              visible: isModerator,
            },
          ];
          this.breadcrumbHome = { icon: 'pi pi-map', routerLink: '/topo' };
        },
      );
    });
  }
}
