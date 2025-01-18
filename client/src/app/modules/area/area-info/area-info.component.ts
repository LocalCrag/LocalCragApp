import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Area } from '../../../models/area';
import { AreasService } from '../../../services/crud/areas.service';
import { Observable } from 'rxjs';
import { MapStyles } from '../../../enums/map-styles';
import { MapMarkerType } from '../../../enums/map-marker-type';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { GradeDistribution } from '../../../models/scale';

@Component({
  selector: 'lc-area-info',
  templateUrl: './area-info.component.html',
  styleUrls: ['./area-info.component.scss'],
})
export class AreaInfoComponent implements OnInit {
  public area: Area;
  public fetchAreaGrades: Observable<GradeDistribution>;
  public areaCoordinates: Coordinates;

  constructor(
    private route: ActivatedRoute,
    private areasService: AreasService,
  ) {}

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
