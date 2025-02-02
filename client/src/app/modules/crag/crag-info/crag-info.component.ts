import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CragsService } from '../../../services/crud/crags.service';
import { Crag } from '../../../models/crag';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { GradeDistribution } from '../../../models/scale';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { MapMarkerType } from '../../../enums/map-marker-type';

/**
 * Component that shows information about a crag.
 */
@Component({
  selector: 'lc-crag-info',
  templateUrl: './crag-info.component.html',
  styleUrls: ['./crag-info.component.scss'],
})
@UntilDestroy()
export class CragInfoComponent implements OnInit {
  public crag: Crag;
  public fetchCragGrades: Observable<GradeDistribution>;
  public cragCoordinates: Coordinates;

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
    });
  }
}
