import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { MenuItem } from 'primeng/api';
import { CragsService } from '../../../services/crud/crags.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { AreasService } from '../../../services/crud/areas.service';
import { TRANSLOCO_SCOPE, TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { EMPTY, forkJoin, throwError } from 'rxjs';
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

import { ScalesService } from '../../../services/crud/scales.service';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';

import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../../services/core/language.service';
import {
  PageTitleService,
  resolveTopoPageTitleImage,
} from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [ClosedSpotTagComponent, SecretSpotTagComponent, RouterOutlet],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'line' }],
})
export class LineComponent implements OnInit {
  public crag: Crag;
  public sector: Sector;
  public area: Area;
  public line: Line;
  public items: MenuItem[];

  private breadcrumbHome: MenuItem = { icon: 'pi pi-map', routerLink: '/topo' };

  private destroyRef = inject(DestroyRef);
  private cragsService = inject(CragsService);
  private sectorsService = inject(SectorsService);
  private areasService = inject(AreasService);
  private linesService = inject(LinesService);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private pageTitleService = inject(PageTitleService);

  protected scalesService = inject(ScalesService);

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
        const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
        const areaSlug = this.route.snapshot.paramMap.get('area-slug');
        const lineSlug = this.route.snapshot.paramMap.get('line-slug');
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
          this.areasService.getArea(areaSlug).pipe(
            catchError((e) => {
              if (e.status === 404 || e.status === 401) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          ),
          this.linesService.getLine(lineSlug).pipe(
            catchError((e) => {
              if (e.status === 404 || e.status === 401) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          ),
          this.store.pipe(select(selectIsModerator), take(1)),
          this.store.pipe(select(selectInstanceSettingsState), take(1)),
        ]).subscribe(
          ([crag, sector, area, line, isModerator, instanceSettings]) => {
            this.crag = crag;
            this.sector = sector;
            this.area = area;
            this.line = line;
            const image = resolveTopoPageTitleImage(
              line.topoImages?.[0],
              instanceSettings.bgImage,
            );
            const gradeValue = instanceSettings.displayUserGrades
              ? line.userGradeValue
              : line.authorGradeValue;
            this.scalesService
              .gradeNameByValue(line.type, line.gradeScale, gradeValue)
              .subscribe((gradeName) => {
                const displayGrade =
                  gradeValue > 0
                    ? gradeName
                    : this.translocoService.translate(gradeName);
                this.pageTitleService.setTitle(`${line.name} ${displayGrade}`, {
                  image,
                });
                const breadcrumbs = [
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
                    routerLink: `/topo/${crag.slug}/${sector.slug}/${area.slug}/topo-images`,
                  },
                  {
                    label: `${line.name} ${displayGrade}`,
                    slug: line.slug,
                  },
                ].filter(
                  (menuItem) => menuItem.slug != environment.skippedSlug,
                );
                this.pageTitleService.setBreadcrumbs(
                  breadcrumbs,
                  this.breadcrumbHome,
                );
                this.buildTabs(isModerator);

                this.store
                  .select(selectInstanceName)
                  .subscribe((instanceName) => {
                    this.title.setTitle(
                      `${line.name} ${displayGrade} / ${area.name} / ${sector.name} / ${crag.name} - ${instanceName}`,
                    );
                  });
              });

            // Rebuild tabs if the rendered language changes
            this.languageService.renderedLanguage$
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((rendered) => {
                if (!rendered) return;
                // only rebuild if data is loaded
                if (this.line) {
                  this.buildTabs(isModerator);
                }
              });
          },
        );
      });
  }

  private buildTabs(isModerator: boolean) {
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
        badge: this.tabBadge(this.line.ascentCount),
      },
      {
        label: this.translocoService.translate(marker('line.gallery')),
        icon: 'pi pi-fw pi-images',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/gallery`,
        visible: true,
        badge: this.tabBadge(this.line.imageCount),
      },
      {
        label: this.translocoService.translate(marker('line.comments')),
        icon: 'pi pi-fw pi-comments',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/comments`,
        visible: true,
        badge: this.tabBadge(this.line.commentCount),
      },
      {
        label: this.translocoService.translate(marker('line.tasks')),
        icon: 'pi pi-fw pi-list-check',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/moderator-tasks`,
        visible: isModerator,
      },
      {
        label: this.translocoService.translate(marker('line.edit')),
        icon: 'pi pi-fw pi-file-edit',
        routerLink: `/topo/${this.crag.slug}/${this.sector.slug}/${this.area.slug}/${this.line.slug}/edit`,
        visible: isModerator,
      },
    ];
    this.pageTitleService.setTabs(this.items);
  }

  private tabBadge(count: number | null | undefined): string | undefined {
    return count && count > 0 ? String(count) : undefined;
  }
}
