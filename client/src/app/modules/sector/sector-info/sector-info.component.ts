import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { Observable } from 'rxjs';
import { Grade } from '../../../utility/misc/grades';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@Component({
  selector: 'lc-sector-info',
  templateUrl: './sector-info.component.html',
  styleUrls: ['./sector-info.component.scss'],
})
@UntilDestroy()
export class SectorInfoComponent implements OnInit {
  public sector: Sector;
  public fetchSectorGrades: Observable<Grade[]>;

  constructor(
    private route: ActivatedRoute,
    private sectorsService: SectorsService,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
      this.sectorsService.getSector(sectorSlug).subscribe((sector) => {
        this.sector = sector;
      });
      this.fetchSectorGrades = this.sectorsService.getSectorGrades(sectorSlug);
    });
  }
}
