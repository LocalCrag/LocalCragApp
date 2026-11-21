import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';
import { TopoQualityRankingRow } from '../../../models/topo-quality';
import { selectAuthState } from '../../../ngrx/selectors/auth.selectors';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { TopoQualityService } from '../../../services/crud/topo-quality.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideCircleX, lucideInfo } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../shared/components/list-skeleton/list-skeleton.component';

@Component({
  providers: [provideIcons({ lucideCircleX, lucideInfo })],
  selector: 'lc-topo-quality-ranking',
  imports: [
    TranslocoDirective,
    RouterLink,
    FormsModule,
    UserAvatarComponent,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    HlmInput,
    HlmSeparator,
    ListSkeletonComponent,
    NgIcon,
  ],
  templateUrl: './topo-quality-ranking.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './topo-quality-ranking.component.scss',
})
export class TopoQualityRankingComponent implements OnInit {
  private topoQualityService = inject(TopoQualityService);
  private store = inject(Store);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  rows: TopoQualityRankingRow[] = [];
  loading = true;
  failed = false;
  canRestart = false;
  confirmation = '';
  restartFailed = false;

  ngOnInit() {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(
        filter((settings) => settings.loaded),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((settings) => {
        if (!settings.moderatorGameEnabled) {
          this.router.navigate(['/topo-quality']);
        }
      });
    this.store
      .select(selectAuthState)
      .pipe(take(1))
      .subscribe((auth) => {
        this.canRestart = !!(auth.user?.admin || auth.user?.superadmin);
      });
    this.load();
  }

  restart() {
    this.restartFailed = false;
    this.topoQualityService.restart(this.confirmation).subscribe({
      next: () => {
        this.confirmation = '';
        this.load();
      },
      error: () => {
        this.restartFailed = true;
      },
    });
  }

  private load() {
    this.loading = true;
    this.failed = false;
    this.topoQualityService.ranking().subscribe({
      next: (rows) => {
        this.rows = rows;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.failed = true;
      },
    });
  }
}
