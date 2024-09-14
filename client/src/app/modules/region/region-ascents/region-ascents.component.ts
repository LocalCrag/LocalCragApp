import {Component, OnInit} from '@angular/core';
import {Area} from '../../../models/area';
import {AreasService} from '../../../services/crud/areas.service';
import {TranslocoService} from '@jsverse/transloco';
import {ActivatedRoute, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {marker} from '@jsverse/transloco-keys-manager/marker';
import {Region} from '../../../models/region';
import {RegionService} from '../../../services/crud/region.service';
import {AscentListComponent} from '../../ascent/ascent-list/ascent-list.component';
import {NgForOf, NgIf} from '@angular/common';
import {SkeletonModule} from 'primeng/skeleton';

@Component({
  selector: 'lc-region-ascents',
  standalone: true,
  imports: [
    AscentListComponent,
    NgForOf,
    SkeletonModule,
    NgIf
  ],
  templateUrl: './region-ascents.component.html',
  styleUrl: './region-ascents.component.scss'
})
export class RegionAscentsComponent implements OnInit {

  public region: Region;

  constructor(private regionService: RegionService,
              private translocoService: TranslocoService,
              private router: Router,
              private store: Store,
              private title: Title,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.regionService.getRegion().subscribe((region) => {
      this.region = region;
      this.store.select(selectInstanceName).subscribe(instanceName => {
        this.title.setTitle(`${region.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`);
      });
    })
  }

}
