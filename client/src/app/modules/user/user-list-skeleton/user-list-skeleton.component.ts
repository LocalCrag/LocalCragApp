import { Component } from '@angular/core';

import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-user-list-skeleton',
  imports: [Skeleton],
  templateUrl: './user-list-skeleton.component.html',
  styleUrl: './user-list-skeleton.component.scss',
})
export class UserListSkeletonComponent {
  protected readonly Array = Array;
}
