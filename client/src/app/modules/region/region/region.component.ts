import {Component, OnInit} from '@angular/core';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {CardModule} from 'primeng/card';
import {NgIf} from '@angular/common';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {TabMenuModule} from 'primeng/tabmenu';
import {Crag} from '../../../models/crag';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../../services/crud/crags.service';
import {TranslocoService} from '@ngneat/transloco';
import {select, Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {untilDestroyed} from '@ngneat/until-destroy';
import {forkJoin, of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Region} from '../../../models/region';
import {RegionService} from '../../../services/crud/region.service';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';

@Component({
  selector: 'lc-region',
  standalone: true,
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    RouterOutlet,
    TabMenuModule
  ],
  templateUrl: './region.component.html',
  styleUrl: './region.component.scss'
})
export class RegionComponent implements OnInit {

  public region: Region;
  public items: MenuItem[];

  constructor(private regionsService: RegionService,
              private translocoService: TranslocoService,
              private router: Router,
              private store: Store,
              private title: Title) {
  }

  ngOnInit() {
    this.region = null;
    forkJoin([
      this.regionsService.getRegion().pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })),
      this.store.pipe(select(selectIsLoggedIn), take(1)),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([region, isLoggedIn]) => {
      this.region = region;
      this.store.select(selectInstanceName).subscribe(instanceName => {
        this.title.setTitle(`${region.name} - ${instanceName}`)
      });
      this.items = [
        {
          label: this.translocoService.translate(marker('region.infos')),
          icon: 'pi pi-fw pi-info-circle',
          routerLink: `/topo`,
          routerLinkActiveOptions: {exact: true}
        },
        {
          label: this.translocoService.translate(marker('region.rules')),
          icon: 'pi pi-fw pi-exclamation-triangle',
          routerLink: `/topo/rules`,
          visible: region.rules !== null
        },
        {
          label: this.translocoService.translate(marker('region.crags')),
          icon: 'pi pi-fw pi-sitemap',
          routerLink: `/topo/crags`,
        },
        // {
        //   label: this.translocoService.translate(marker('region.gallery')),
        //   icon: 'pi pi-fw pi-images',
        //   routerLink: `/topo/gallery`,
        // },
        {
          label: this.translocoService.translate(marker('region.ascents')),
          icon: 'pi pi-fw pi-check-square',
          routerLink: `/topo/ascents`,
        },
        {
          label: this.translocoService.translate(marker('region.edit')),
          icon: 'pi pi-fw pi-file-edit',
          routerLink: `/topo/edit-region`,
          visible: isLoggedIn,
        },
      ];
    })
  }


}
