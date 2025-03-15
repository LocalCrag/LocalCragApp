import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { SkeletonModule } from 'primeng/skeleton';
import { Sector } from '../../../models/sector';
import { ActivatedRoute, Router } from '@angular/router';
import { SectorsService } from '../../../services/crud/sectors.service';

/**
 * Component that displays sector rules.
 */
@Component({
  selector: 'lc-sector-rules',
  imports: [NgIf, SharedModule, SkeletonModule],
  templateUrl: './sector-rules.component.html',
  styleUrl: './sector-rules.component.scss',
})
export class SectorRulesComponent implements OnInit {
  public sector: Sector;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sectorsService: SectorsService,
  ) {}

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
