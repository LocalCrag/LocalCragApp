import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';

import { RankingListComponent } from '../../ranking/ranking-list/ranking-list.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-sector-ranking',
  imports: [RankingListComponent],
  templateUrl: './sector-ranking.component.html',
  styleUrl: './sector-ranking.component.scss',
})
export class SectorRankingComponent implements OnInit {
  public sector: Sector;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private sectorsService = inject(SectorsService);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.sector = null;
        const sectorSlug = params.get('sector-slug');
        this.sectorsService.getSector(sectorSlug).subscribe((sector) => {
          this.sector = sector;
        });
      });
  }
}
