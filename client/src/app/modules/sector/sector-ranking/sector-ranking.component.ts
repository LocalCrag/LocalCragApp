import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { NgIf } from '@angular/common';
import { RankingListComponent } from '../../ranking/ranking-list/ranking-list.component';

@Component({
  selector: 'lc-sector-ranking',
  imports: [NgIf, RankingListComponent],
  templateUrl: './sector-ranking.component.html',
  styleUrl: './sector-ranking.component.scss',
})
@UntilDestroy()
export class SectorRankingComponent implements OnInit {
  public sector: Sector;

  constructor(
    private route: ActivatedRoute,
    private sectorsService: SectorsService,
  ) {}

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(untilDestroyed(this))
      .subscribe((params) => {
        this.sector = null;
        const sectorSlug = params.get('sector-slug');
        this.sectorsService.getSector(sectorSlug).subscribe((sector) => {
          this.sector = sector;
        });
      });
  }
}
