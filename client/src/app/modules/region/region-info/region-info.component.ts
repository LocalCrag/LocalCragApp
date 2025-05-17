import { Component, OnInit } from '@angular/core';
import { GradeDistributionBarChartComponent } from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { SkeletonModule } from 'primeng/skeleton';
import { Observable } from 'rxjs';
import { Region } from '../../../models/region';
import { RegionService } from '../../../services/crud/region.service';
import { NgIf } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { MapComponent } from '../../maps/map/map.component';
import { GradeDistribution } from '../../../models/scale';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';

/**
 * Component that shows information about a region.
 */
@Component({
  selector: 'lc-region-info',
  imports: [
    GradeDistributionBarChartComponent,
    SkeletonModule,
    NgIf,
    TranslocoDirective,
    MapComponent,
    SanitizeHtmlPipe,
  ],
  templateUrl: './region-info.component.html',
  styleUrl: './region-info.component.scss',
})
export class RegionInfoComponent implements OnInit {
  public region: Region;
  public fetchRegionGrades: Observable<GradeDistribution>;

  constructor(private regionsService: RegionService) {}

  ngOnInit() {
    this.region = null;
    this.regionsService.getRegion().subscribe((region) => {
      this.region = region;
    });
    this.fetchRegionGrades = this.regionsService.getRegionGrades();
  }
}
