import { Component, OnInit, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { Sector } from '../../../models/sector';
import { ActivatedRoute, Router } from '@angular/router';
import { SectorsService } from '../../../services/crud/sectors.service';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';

/**
 * Component that displays sector rules.
 */
@Component({
  selector: 'lc-sector-rules',
  imports: [NgIf, SkeletonModule, SanitizeHtmlPipe],
  templateUrl: './sector-rules.component.html',
  styleUrl: './sector-rules.component.scss',
})
export class SectorRulesComponent implements OnInit {
  public sector: Sector;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sectorsService = inject(SectorsService);

  ngOnInit() {
    const sectorSlug =
      this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.sectorsService.getSector(sectorSlug).subscribe((sector) => {
      this.sector = sector;
      if (!this.sector.rules) {
        this.router.navigate(['../'], { relativeTo: this.route });
      }
    });
  }
}
