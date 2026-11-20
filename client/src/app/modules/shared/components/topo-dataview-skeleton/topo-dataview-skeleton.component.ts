import { Component } from '@angular/core';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { NgClass } from '@angular/common';

@Component({
  selector: 'lc-topo-dataview-skeleton',
  imports: [HlmSkeleton, NgClass],
  templateUrl: './topo-dataview-skeleton.component.html',
  styleUrl: './topo-dataview-skeleton.component.scss',
})
export class TopoDataviewSkeletonComponent {}
