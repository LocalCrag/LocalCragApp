import {Component, OnInit} from '@angular/core';
import {
    GradeDistributionBarChartComponent
} from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import {NgIf} from '@angular/common';
import {SharedModule} from '../../shared/shared.module';
import {SkeletonModule} from 'primeng/skeleton';
import {TranslocoDirective} from '@ngneat/transloco';
import {Sector} from '../../../models/sector';
import {Observable} from 'rxjs';
import {Grade} from '../../../utility/misc/grades';
import {ActivatedRoute, Router} from '@angular/router';
import {SectorsService} from '../../../services/crud/sectors.service';

/**
 * Component that displays sector rules.
 */
@Component({
  selector: 'lc-sector-rules',
  standalone: true,
    imports: [
        GradeDistributionBarChartComponent,
        NgIf,
        SharedModule,
        SkeletonModule,
        TranslocoDirective
    ],
  templateUrl: './sector-rules.component.html',
  styleUrl: './sector-rules.component.scss'
})
export class SectorRulesComponent implements OnInit{

  public sector: Sector;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private sectorsService: SectorsService) {
  }

  ngOnInit() {
    const sectorSlug = this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.sectorsService.getSector(sectorSlug).subscribe(sector => {
      this.sector = sector;
      if (!this.sector.rules) {
        this.router.navigate(['../'], {relativeTo: this.route});
      }
    });
  }

}
