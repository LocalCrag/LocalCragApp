import {Component, OnInit} from '@angular/core';
import {Crag} from '../../../models/crag';
import {ActivatedRoute} from '@angular/router';
import {CragsService} from '../../../services/crud/crags.service';
import {Sector} from '../../../models/sector';
import {SectorsService} from '../../../services/crud/sectors.service';

@Component({
  selector: 'lc-sector-info',
  templateUrl: './sector-info.component.html',
  styleUrls: ['./sector-info.component.scss']
})
export class SectorInfoComponent implements OnInit{

  public sector: Sector;

  constructor(private route: ActivatedRoute,
              private sectorsService: SectorsService) {
  }

  ngOnInit() {
    const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    this.sectorsService.getSector(sectorSlug).subscribe(sector => {
      this.sector = sector;
    });
  }

}
