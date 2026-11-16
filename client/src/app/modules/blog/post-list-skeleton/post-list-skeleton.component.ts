import { Component } from '@angular/core';

import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-post-list-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './post-list-skeleton.component.html',
  styleUrl: './post-list-skeleton.component.scss',
})
export class PostListSkeletonComponent {}
