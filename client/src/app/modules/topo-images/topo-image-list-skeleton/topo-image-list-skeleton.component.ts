import { Component } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'lc-topo-image-list-skeleton',
  imports: [Skeleton, NgForOf],
  templateUrl: './topo-image-list-skeleton.component.html',
  styleUrl: './topo-image-list-skeleton.component.scss',
})
export class TopoImageListSkeletonComponent {}
