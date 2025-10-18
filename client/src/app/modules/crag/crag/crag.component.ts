import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CragsService } from '../../../services/crud/crags.service';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { Crag } from '../../../models/crag';
import { MenuItem } from 'primeng/api';
import { TRANSLOCO_SCOPE, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { selectIsModerator } from '../../../ngrx/selectors/auth.selectors';
import { Title } from '@angular/platform-browser';

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
  selector: 'lc-crag',
  templateUrl: './crag.component.html',
  styleUrls: ['./crag.component.scss'],
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
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'crag' }],
})
export class CragComponent implements OnInit {
  public crag: Crag;
  public items: MenuItem[];
  public breadcrumbs: MenuItem[] | undefined;
  public breadcrumbHome: MenuItem | undefined;

  private destroyRef = inject(DestroyRef);

  constructor(
    private cragsService: CragsService,
    private translocoService: TranslocoService,
    private router: Router,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
  ) {}

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
              }
              return of(e);
            }),
          ),
          this.store.pipe(select(selectIsModerator), take(1)),
          this.translocoService.load(`${environment.language}`),
        ]).subscribe(([crag, isModerator]) => {
          this.crag = crag;
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
            });
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
        });
      });
  }

  protected readonly environment = environment;
}
