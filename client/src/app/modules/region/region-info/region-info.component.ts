import {Component, OnInit} from '@angular/core';
import {
  GradeDistributionBarChartComponent
} from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import {SharedModule} from '../../shared/shared.module';
import {SkeletonModule} from 'primeng/skeleton';
import {Crag} from '../../../models/crag';
import {Observable} from 'rxjs';
import {Grade} from '../../../utility/misc/grades';
import {ActivatedRoute} from '@angular/router';
import {CragsService} from '../../../services/crud/crags.service';
import {untilDestroyed} from '@ngneat/until-destroy';
import {Region} from '../../../models/region';
import {RegionService} from '../../../services/crud/region.service';
import {environment} from '../../../../environments/environment';
import {NgIf} from '@angular/common';
import {TranslocoDirective} from '@ngneat/transloco';

/**
 * Component that shows information about a region.
 */
@Component({
  selector: 'lc-region-info',
  standalone: true,
  imports: [
    GradeDistributionBarChartComponent,
    SharedModule,
    SkeletonModule,
    NgIf,
    TranslocoDirective
  ],
  templateUrl: './region-info.component.html',
  styleUrl: './region-info.component.scss'
})
export class RegionInfoComponent implements OnInit {

  public region: Region;
  public fetchRegionGrades: Observable<Grade[]>;

  constructor(private regionsService: RegionService) {
  }

  ngOnInit() {
    this.region = null;
    this.regionsService.getRegion().subscribe(region => {
      this.region = region;
    });
    this.fetchRegionGrades = this.regionsService.getRegionGrades();
  }

}
