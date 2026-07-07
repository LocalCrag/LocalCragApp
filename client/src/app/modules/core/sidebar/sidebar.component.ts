import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { Skeleton } from 'primeng/skeleton';
import { InstanceStatistics } from '../../../models/instance-statistics';
import { StatisticsService } from '../../../services/crud/statistics.service';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';

@Component({
  selector: 'lc-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [TranslocoDirective, RouterLink, LineGradePipe, Skeleton],
})
export class SidebarComponent implements OnInit {
  private statisticsService = inject(StatisticsService);

  stats: InstanceStatistics | null = null;
  loading = true;

  ngOnInit(): void {
    this.statisticsService.getInstanceStatistics().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
