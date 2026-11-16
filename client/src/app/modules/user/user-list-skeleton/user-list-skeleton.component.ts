import { Component } from '@angular/core';

import { HlmSkeleton } from '@spartan-ng/helm/skeleton';

@Component({
  selector: 'lc-user-list-skeleton',
  imports: [HlmSkeleton],
  templateUrl: './user-list-skeleton.component.html',
  styleUrl: './user-list-skeleton.component.scss',
})
export class UserListSkeletonComponent {
  protected readonly Array = Array;
}
