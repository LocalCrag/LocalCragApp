import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { Button } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { filter, take } from 'rxjs/operators';
import { TopoQualityRankingRow } from '../../../models/topo-quality';
import { selectAuthState } from '../../../ngrx/selectors/auth.selectors';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { TopoQualityService } from '../../../services/crud/topo-quality.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'lc-topo-quality-ranking',
  imports: [
    TranslocoDirective,
    RouterLink,
    FormsModule,
    Button,
    DividerModule,
    InputText,
    Message,
    UserAvatarComponent,
  ],
  templateUrl: './topo-quality-ranking.component.html',
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
