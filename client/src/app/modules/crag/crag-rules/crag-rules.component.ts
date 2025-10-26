import { Component, DestroyRef, inject, OnInit } from '@angular/core';

import { SkeletonModule } from 'primeng/skeleton';
import { Crag } from '../../../models/crag';
import { ActivatedRoute, Router } from '@angular/router';
import { CragsService } from '../../../services/crud/crags.service';

import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component that shows the rules of a crag.
 */
@Component({
  selector: 'lc-crag-rules',
  imports: [SkeletonModule, SanitizeHtmlPipe],
  templateUrl: './crag-rules.component.html',
  styleUrl: './crag-rules.component.scss',
})
export class CragRulesComponent implements OnInit {
  public crag: Crag;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cragsService = inject(CragsService);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.crag = null;
        const cragSlug = params.get('crag-slug');
        this.cragsService.getCrag(cragSlug).subscribe((crag) => {
          this.crag = crag;
          if (!this.crag.rules) {
            this.router.navigate(['../'], { relativeTo: this.route });
          }
        });
      });
  }
}
