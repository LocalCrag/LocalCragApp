import { Component, OnInit } from '@angular/core';
import { Crag } from '../../../models/crag';
import { ActivatedRoute } from '@angular/router';
import { CragsService } from '../../../services/crud/crags.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { RankingListComponent } from '../../ranking/ranking-list/ranking-list.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lc-crag-ranking',
  imports: [RankingListComponent, NgIf],
  templateUrl: './crag-ranking.component.html',
  styleUrl: './crag-ranking.component.scss',
})
@UntilDestroy()
export class CragRankingComponent implements OnInit {
  public crag: Crag;

  constructor(
    private route: ActivatedRoute,
    private cragsService: CragsService,
  ) {}

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(untilDestroyed(this))
      .subscribe((params) => {
        this.crag = null;
        const cragSlug = params.get('crag-slug');
        this.cragsService.getCrag(cragSlug).subscribe((crag) => {
          this.crag = crag;
        });
      });
  }
}
