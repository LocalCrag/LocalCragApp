import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-ranking-list-skeleton',
  imports: [NgForOf, Skeleton],
  templateUrl: './ranking-list-skeleton.component.html',
  styleUrl: './ranking-list-skeleton.component.scss',
})
export class RankingListSkeletonComponent {}
