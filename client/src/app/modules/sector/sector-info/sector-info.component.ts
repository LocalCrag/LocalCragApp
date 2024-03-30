import {Component, OnInit} from '@angular/core';
import {Crag} from '../../../models/crag';
import {ActivatedRoute} from '@angular/router';
import {CragsService} from '../../../services/crud/crags.service';
import {Sector} from '../../../models/sector';
import {SectorsService} from '../../../services/crud/sectors.service';
import {Observable} from 'rxjs';
import {Grade} from '../../../utility/misc/grades';
import {untilDestroyed} from '@ngneat/until-destroy';

@Component({
  selector: 'lc-sector-info',
  templateUrl: './sector-info.component.html',
  styleUrls: ['./sector-info.component.scss']
})
export class SectorInfoComponent implements OnInit{

  public sector: Sector;
  public fetchSectorGrades: Observable<Grade[]>;

  constructor(private route: ActivatedRoute,
              private sectorsService: SectorsService) {
  }

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(params => {
      console.log(42);
      const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
      this.sectorsService.getSector(sectorSlug).subscribe(sector => {
        this.sector = sector;
      });
      this.fetchSectorGrades = this.sectorsService.getSectorGrades(sectorSlug);
    });
  }

}
