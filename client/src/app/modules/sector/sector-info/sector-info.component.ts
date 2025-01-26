import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { Observable } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MapMarkerType } from '../../../enums/map-marker-type';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { GradeDistribution } from '../../../models/scale';

@Component({
  selector: 'lc-sector-info',
  templateUrl: './sector-info.component.html',
  styleUrls: ['./sector-info.component.scss'],
})
@UntilDestroy()
export class SectorInfoComponent implements OnInit {
  public sector: Sector;
  public fetchSectorGrades: Observable<GradeDistribution>;
  public sectorCoordinates: Coordinates;

  constructor(
    private route: ActivatedRoute,
    private sectorsService: SectorsService,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
      this.sectorsService.getSector(sectorSlug).subscribe((sector) => {
        this.sector = sector;
        this.sector.mapMarkers.map((marker) => {
          if (marker.type === MapMarkerType.SECTOR) {
            this.sectorCoordinates = marker.coordinates;
          }
        });
      });
      this.fetchSectorGrades = this.sectorsService.getSectorGrades(sectorSlug);
    });
  }
}
