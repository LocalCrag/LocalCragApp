import { Component, OnInit, inject } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';

import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { forkJoin, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Region } from '../../../models/region';
import { RegionService } from '../../../services/crud/region.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { SetActiveTabDirective } from '../../shared/directives/set-active-tab.directive';

@Component({
  selector: 'lc-region',
  imports: [
    BreadcrumbModule,
    CardModule,
    RouterOutlet,
    TranslocoDirective,
    Tabs,
    TabList,
    Tab,
    RouterLink,
    SetActiveTabDirective,
  ],
  templateUrl: './region.component.html',
  styleUrl: './region.component.scss',
})
export class RegionComponent implements OnInit {
  public region: Region;
  public items: MenuItem[];

  private regionsService = inject(RegionService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);

  ngOnInit() {
    this.region = null;
    forkJoin([
      this.regionsService.getRegion().pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        }),
      ),
      this.store.pipe(select(selectIsLoggedIn), take(1)),
    ]).subscribe(([region, isLoggedIn]) => {
      this.region = region;
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(`${region.name} - ${instanceName}`);
      });
      this.items = [
        {
          label: this.translocoService.translate(marker('region.infos')),
          icon: 'pi pi-fw pi-info-circle',
          routerLink: `/topo`,
          routerLinkActiveOptions: { exact: true },
          visible: true,
        },
        {
          label: this.translocoService.translate(marker('region.rules')),
          icon: 'pi pi-fw pi-exclamation-triangle',
          routerLink: `/topo/rules`,
          visible: region.rules !== null,
        },
        {
          label: this.translocoService.translate(marker('region.crags')),
          icon: 'pi pi-fw pi-sitemap',
          routerLink: `/topo/crags`,
          visible: true,
        },
        {
          label: this.translocoService.translate(marker('region.lines')),
          icon: 'pi pi-fw pi-chart-line',
          routerLink: `/topo/lines`,
          visible: true,
        },
        {
          label: this.translocoService.translate(marker('region.ascents')),
          icon: 'pi pi-fw pi-check-square',
          routerLink: `/topo/ascents`,
          visible: true,
        },
        {
          label: this.translocoService.translate(marker('region.ranking')),
          icon: 'pi pi-fw pi-trophy',
          routerLink: `/topo/ranking`,
          visible: true,
        },
        {
          label: this.translocoService.translate(marker('region.gallery')),
          icon: 'pi pi-fw pi-images',
          routerLink: `/topo/gallery`,
          visible: true,
        },
        {
          label: this.translocoService.translate(marker('region.comments')),
          icon: 'pi pi-fw pi-comments',
          routerLink: `/topo/comments`,
          visible: true,
        },
        {
          label: this.translocoService.translate(marker('region.edit')),
          icon: 'pi pi-fw pi-file-edit',
          routerLink: `/topo/edit-region`,
          visible: isLoggedIn,
        },
      ];
    });
  }
}
