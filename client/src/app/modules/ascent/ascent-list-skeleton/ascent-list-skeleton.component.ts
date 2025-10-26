import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-ascent-list-skeleton',
  imports: [SkeletonModule],
  templateUrl: './ascent-list-skeleton.component.html',
  styleUrl: './ascent-list-skeleton.component.scss',
})
export class AscentListSkeletonComponent {}
