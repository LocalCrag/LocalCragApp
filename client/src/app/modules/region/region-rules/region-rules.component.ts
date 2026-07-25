import { Component, OnInit, inject } from '@angular/core';

import { SkeletonModule } from 'primeng/skeleton';
import { Region } from '../../../models/region';
import { RegionService } from '../../../services/crud/region.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { RulesViewMetaComponent } from '../../shared/components/rules-view-meta/rules-view-meta.component';

/**
 * Component that displays region rules.
 */
@Component({
  selector: 'lc-region-rules',
  imports: [SkeletonModule, SanitizeHtmlPipe, RulesViewMetaComponent],
  templateUrl: './region-rules.component.html',
  styleUrl: './region-rules.component.scss',
})
export class RegionRulesComponent implements OnInit {
  public region: Region;

  private regionsService = inject(RegionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit() {
    this.region = null;
    this.regionsService.getRegion().subscribe((region) => {
      this.region = region;
      if (!this.region.rules) {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
  }
}
