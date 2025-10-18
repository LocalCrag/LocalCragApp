import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Crag } from '../../../models/crag';
import { ActivatedRoute } from '@angular/router';
import { CragsService } from '../../../services/crud/crags.service';

import { RankingListComponent } from '../../ranking/ranking-list/ranking-list.component';
import { NgIf } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-crag-ranking',
  imports: [RankingListComponent, NgIf],
  templateUrl: './crag-ranking.component.html',
  styleUrl: './crag-ranking.component.scss',
})
export class CragRankingComponent implements OnInit {
  public crag: Crag;

  private destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private cragsService: CragsService,
  ) {}

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.crag = null;
        const cragSlug = params.get('crag-slug');
        this.cragsService.getCrag(cragSlug).subscribe((crag) => {
          this.crag = crag;
        });
      });
  }
}
