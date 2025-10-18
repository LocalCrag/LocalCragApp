import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { NgIf } from '@angular/common';
import { RankingListComponent } from '../../ranking/ranking-list/ranking-list.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-sector-ranking',
  imports: [NgIf, RankingListComponent],
  templateUrl: './sector-ranking.component.html',
  styleUrl: './sector-ranking.component.scss',
})
export class SectorRankingComponent implements OnInit {
  public sector: Sector;

  constructor(
    private route: ActivatedRoute,
    private sectorsService: SectorsService,
  ) {}

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.sector = null;
        const sectorSlug = params.get('sector-slug');
        this.sectorsService.getSector(sectorSlug).subscribe((sector) => {
          this.sector = sector;
        });
      });
  }
}
