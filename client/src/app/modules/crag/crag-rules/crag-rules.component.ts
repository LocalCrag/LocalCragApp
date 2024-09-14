import {Component, OnInit} from '@angular/core';
import {
  GradeDistributionBarChartComponent
} from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import {MessagesModule} from 'primeng/messages';
import {NgIf} from '@angular/common';
import {SkeletonModule} from 'primeng/skeleton';
import {TranslocoDirective} from '@jsverse/transloco';
import {Crag} from '../../../models/crag';
import {ActivatedRoute, Router} from '@angular/router';
import {CragsService} from '../../../services/crud/crags.service';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {SharedModule} from '../../shared/shared.module';

/**
 * Component that shows the rules of a crag.
 */
@Component({
  selector: 'lc-crag-rules',
  standalone: true,
  imports: [
    GradeDistributionBarChartComponent,
    MessagesModule,
    NgIf,
    SharedModule,
    SkeletonModule,
    TranslocoDirective
  ],
  templateUrl: './crag-rules.component.html',
  styleUrl: './crag-rules.component.scss'
})
@UntilDestroy()
export class CragRulesComponent implements OnInit{

  public crag: Crag;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private cragsService: CragsService) {
  }

  ngOnInit() {
    this.route.parent.parent.paramMap.pipe(untilDestroyed(this)).subscribe(params => {
      this.crag = null;
      const cragSlug = params.get('crag-slug');
      this.cragsService.getCrag(cragSlug).subscribe(crag => {
        this.crag = crag;
        if (!this.crag.rules) {
          this.router.navigate(['../'], {relativeTo: this.route});
        }
      });
    });
  }

}
