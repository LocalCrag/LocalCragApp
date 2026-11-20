import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { EMPTY } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TopoQualityTree } from '../../../models/topo-quality';
import { TopoQualityService } from '../../../services/crud/topo-quality.service';
import { TopoQualityBarComponent } from '../topo-quality-bar/topo-quality-bar.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronRight,
  lucideCircleHelp,
  lucideCircleX,
  lucideInfo,
} from '@ng-icons/lucide';

@Component({
  providers: [
    provideIcons({
      lucideChevronDown,
      lucideChevronRight,
      lucideCircleHelp,
      lucideCircleX,
      lucideInfo,
    }),
  ],
  selector: 'lc-topo-quality-tree',
  imports: [
    TranslocoDirective,
    RouterLink,
    TopoQualityBarComponent,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    HlmSkeleton,
    NgIcon,
  ],
  templateUrl: './topo-quality-tree.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './topo-quality-tree.component.scss',
})
export class TopoQualityTreeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private topoQualityService = inject(TopoQualityService);

  tree: TopoQualityTree | null = null;
  loading = true;
  failed = false;
  regionExpanded = true;
  readonly skeletonRows = ['10rem', '7rem', '12rem', '9rem'];
  expandedCrags = new Set<string>();
  expandedSectors = new Set<string>();

  ngOnInit() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          this.loading = true;
          this.failed = false;
          return this.topoQualityService
            .tree(params.get('excludeSecret') === 'true')
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
      .subscribe((tree) => {
        this.tree = tree;
        this.loading = false;
      });
  }

  sectorKey(cragSlug: string, sectorSlug: string): string {
    return `${cragSlug}/${sectorSlug}`;
  }

  toggle(set: Set<string>, id: string) {
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
  }
}
