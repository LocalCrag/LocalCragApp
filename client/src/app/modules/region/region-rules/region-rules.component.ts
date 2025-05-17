import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { Region } from '../../../models/region';
import { RegionService } from '../../../services/crud/region.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';

/**
 * Component that displays region rules.
 */
@Component({
  selector: 'lc-region-rules',
  imports: [NgIf, SkeletonModule, SanitizeHtmlPipe],
  templateUrl: './region-rules.component.html',
  styleUrl: './region-rules.component.scss',
})
export class RegionRulesComponent implements OnInit {
  public region: Region;

  constructor(
    private regionsService: RegionService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

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
