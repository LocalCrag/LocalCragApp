import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CragsService } from '../../../services/crud/crags.service';
import { Crag } from '../../../models/crag';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { GradeDistribution } from '../../../models/scale';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { MapMarkerType } from '../../../enums/map-marker-type';
import { Season } from '../../../models/season';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIf } from '@angular/common';
import { ClosedSpotAlertComponent } from '../../shared/components/closed-spot-alert/closed-spot-alert.component';
import { GradeDistributionBarChartComponent } from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { CoordinatesButtonComponent } from '../../shared/components/coordinates-button/coordinates-button.component';
import { MapComponent } from '../../maps/map/map.component';
import { SeasonChartComponent } from '../../shared/components/season-chart/season-chart.component';
import { Skeleton } from 'primeng/skeleton';

/**
 * Component that shows information about a crag.
 */
@Component({
  selector: 'lc-crag-info',
  templateUrl: './crag-info.component.html',
  styleUrls: ['./crag-info.component.scss'],
  imports: [
    TranslocoDirective,
    NgIf,
    ClosedSpotAlertComponent,
    GradeDistributionBarChartComponent,
    SanitizeHtmlPipe,
    CoordinatesButtonComponent,
    MapComponent,
    SeasonChartComponent,
    Skeleton,
  ],
})
@UntilDestroy()
export class CragInfoComponent implements OnInit {
  public crag: Crag;
  public fetchCragGrades: Observable<GradeDistribution>;
  public cragCoordinates: Coordinates;
  public season: Season;

  constructor(
    private route: ActivatedRoute,
    private cragsService: CragsService,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      this.crag = null;
      const cragSlug = params.get('crag-slug');
      this.cragsService.getCrag(cragSlug).subscribe((crag) => {
        this.crag = crag;
        this.crag.mapMarkers.map((marker) => {
          if (marker.type === MapMarkerType.CRAG) {
            this.cragCoordinates = marker.coordinates;
          }
        });
      });
      this.fetchCragGrades = this.cragsService.getCragGrades(cragSlug);
      this.cragsService.getSeason(cragSlug).subscribe((season) => {
        this.season = season;
      });
    });
  }
}
