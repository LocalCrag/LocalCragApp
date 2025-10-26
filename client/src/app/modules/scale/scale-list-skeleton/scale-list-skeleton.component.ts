import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-scale-list-skeleton',
  imports: [Card, Skeleton],
  templateUrl: './scale-list-skeleton.component.html',
  styleUrl: './scale-list-skeleton.component.scss',
})
export class ScaleListSkeletonComponent {}
