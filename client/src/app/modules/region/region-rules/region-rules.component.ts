import { Component } from '@angular/core';
import {
    GradeDistributionBarChartComponent
} from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import {NgIf} from '@angular/common';
import {SharedModule} from '../../shared/shared.module';
import {SkeletonModule} from 'primeng/skeleton';
import {TranslocoDirective} from '@ngneat/transloco';
import {Region} from '../../../models/region';
import {Observable} from 'rxjs';
import {Grade} from '../../../utility/misc/grades';
import {RegionService} from '../../../services/crud/region.service';
import {environment} from '../../../../environments/environment';
import {ActivatedRoute, Router} from '@angular/router';

/**
 * Component that displays region rules.
 */
@Component({
  selector: 'lc-region-rules',
  standalone: true,
    imports: [
        GradeDistributionBarChartComponent,
        NgIf,
        SharedModule,
        SkeletonModule,
        TranslocoDirective
    ],
  templateUrl: './region-rules.component.html',
  styleUrl: './region-rules.component.scss'
})
export class RegionRulesComponent {

  public region: Region;

  constructor(private regionsService: RegionService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  ngOnInit() {
    this.region = null;
    this.regionsService.getRegion().subscribe(region => {
      this.region = region;
      if (!this.region.rules) {
        this.router.navigate(['../'], {relativeTo: this.route});
      }
    });
  }

}
