import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { combineLatest, EMPTY } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Message } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import {
  TopoQualityDetail,
  TopoQualityItem,
  itemCrumbs,
  itemLink,
} from '../../../models/topo-quality';
import { TopoQualityService } from '../../../services/crud/topo-quality.service';
import { TopoQualityBarComponent } from '../topo-quality-bar/topo-quality-bar.component';

@Component({
  selector: 'lc-topo-quality-detail',
  imports: [
    TranslocoDirective,
    RouterLink,
    Message,
    TooltipModule,
    TopoQualityBarComponent,
  ],
  templateUrl: './topo-quality-detail.component.html',
  styleUrl: './topo-quality-detail.component.scss',
})
export class TopoQualityDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private topoQualityService = inject(TopoQualityService);

  detail: TopoQualityDetail | null = null;
  loading = true;
  failed = false;
  itemLink = itemLink;
  itemCrumbs = itemCrumbs;

  ngOnInit() {
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
      this.route.data,
    ])
      .pipe(
        switchMap(([params, query, data]) => {
          const level = data['level'] as string;
          this.loading = true;
          this.failed = false;
          return this.topoQualityService
            .detail(
              level,
              {
                cragSlug: params.get('cragSlug') ?? undefined,
                sectorSlug: params.get('sectorSlug') ?? undefined,
                areaSlug: params.get('areaSlug') ?? undefined,
              },
              query.get('excludeSecret') === 'true',
            )
            .pipe(
              catchError(() => {
                this.loading = false;
                this.failed = true;
                return EMPTY;
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((detail) => {
        this.detail = detail;
        this.loading = false;
      });
  }

  itemName(item: TopoQualityItem, untitled: string): string {
    return item.name || untitled;
  }
}
