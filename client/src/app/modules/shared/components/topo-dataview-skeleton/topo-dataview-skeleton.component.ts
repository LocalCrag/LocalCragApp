import { Component } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { NgClass, NgForOf } from '@angular/common';

@Component({
  selector: 'lc-topo-dataview-skeleton',
  imports: [Skeleton, NgClass, NgForOf],
  templateUrl: './topo-dataview-skeleton.component.html',
  styleUrl: './topo-dataview-skeleton.component.scss',
})
export class TopoDataviewSkeletonComponent {}
