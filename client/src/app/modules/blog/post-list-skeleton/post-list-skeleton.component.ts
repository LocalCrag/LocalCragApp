import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-post-list-skeleton',
  imports: [NgForOf, Skeleton],
  templateUrl: './post-list-skeleton.component.html',
  styleUrl: './post-list-skeleton.component.scss',
})
export class PostListSkeletonComponent {}
