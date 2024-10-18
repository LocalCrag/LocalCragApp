import { Component, Input, OnInit } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-form-skeleton',
  standalone: true,
  imports: [NgIf, SkeletonModule, NgForOf],
  templateUrl: './form-skeleton.component.html',
  styleUrl: './form-skeleton.component.scss',
})
export class FormSkeletonComponent {
  /**
   * Accepts a string of "I" and "T". "I" will render an inout skeleton, "T" a textarea skeleton.
   */
  @Input() parts = 'ITTTII';
}
