import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Area } from '../../../models/area';
import { AreasService } from '../../../services/crud/areas.service';
import { Observable } from 'rxjs';
import { MapStyles } from '../../../enums/map-styles';
import { MapMarkerType } from '../../../enums/map-marker-type';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { GradeDistribution } from '../../../models/scale';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIf } from '@angular/common';
import { ClosedSpotAlertComponent } from '../../shared/components/closed-spot-alert/closed-spot-alert.component';
import { GradeDistributionBarChartComponent } from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { CoordinatesButtonComponent } from '../../shared/components/coordinates-button/coordinates-button.component';
import { MapComponent } from '../../maps/map/map.component';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-area-info',
  templateUrl: './area-info.component.html',
  styleUrls: ['./area-info.component.scss'],
  imports: [
    TranslocoDirective,
    NgIf,
    ClosedSpotAlertComponent,
    GradeDistributionBarChartComponent,
    SanitizeHtmlPipe,
    CoordinatesButtonComponent,
    MapComponent,
    Skeleton,
  ],
})
export class AreaInfoComponent implements OnInit {
  public area: Area;
  public fetchAreaGrades: Observable<GradeDistribution>;
  public areaCoordinates: Coordinates;

  private route = inject(ActivatedRoute);
  private areasService = inject(AreasService);

  ngOnInit() {
    const areaSlug = this.route.snapshot.paramMap.get('area-slug');
    this.areasService.getArea(areaSlug).subscribe((area) => {
      this.area = area;
      this.area.mapMarkers.map((marker) => {
        if (marker.type === MapMarkerType.AREA) {
          this.areaCoordinates = marker.coordinates;
        }
      });
    });
    this.fetchAreaGrades = this.areasService.getAreaGrades(areaSlug);
  }

  protected readonly MapStyles = MapStyles;
}
