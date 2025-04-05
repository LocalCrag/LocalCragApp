import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-user-list-skeleton',
  imports: [NgForOf, Skeleton],
  templateUrl: './user-list-skeleton.component.html',
  styleUrl: './user-list-skeleton.component.scss',
})
export class UserListSkeletonComponent {}
