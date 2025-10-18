import { Component, OnInit, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Region } from '../../../models/region';
import { RegionService } from '../../../services/crud/region.service';
import { AscentListComponent } from '../../ascent/ascent-list/ascent-list.component';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-region-ascents',
  imports: [AscentListComponent, SkeletonModule],
  templateUrl: './region-ascents.component.html',
  styleUrl: './region-ascents.component.scss',
})
export class RegionAscentsComponent implements OnInit {
  public region: Region;

  private regionService = inject(RegionService);
  private translocoService = inject(TranslocoService);
  private store = inject(Store);
  private title = inject(Title);

  ngOnInit() {
    this.regionService.getRegion().subscribe((region) => {
      this.region = region;
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${region.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
        );
      });
    });
  }
}
