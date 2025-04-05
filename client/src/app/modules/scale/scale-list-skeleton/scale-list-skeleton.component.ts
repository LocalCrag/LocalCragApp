import { Component } from '@angular/core';
import { Card } from 'primeng/card';
import { Skeleton } from 'primeng/skeleton';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'lc-scale-list-skeleton',
  imports: [Card, Skeleton, NgForOf],
  templateUrl: './scale-list-skeleton.component.html',
  styleUrl: './scale-list-skeleton.component.scss',
})
export class ScaleListSkeletonComponent {}
