import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-line-list-skeleton',
  imports: [NgForOf, Skeleton],
  templateUrl: './line-list-skeleton.component.html',
  styleUrl: './line-list-skeleton.component.scss',
})
export class LineListSkeletonComponent {}
