import { Component, Input } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-form-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './form-skeleton.component.html',
  styleUrl: './form-skeleton.component.scss',
})
export class FormSkeletonComponent {
  /**
   * Accepts a string of "I" and "T". "I" will render an inout skeleton, "T" a textarea skeleton.
   */
  @Input() parts = 'ITTTII';
}
