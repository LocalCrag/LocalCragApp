import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'lc-ascent-list-skeleton',
  imports: [SkeletonModule, NgForOf],
  templateUrl: './ascent-list-skeleton.component.html',
  styleUrl: './ascent-list-skeleton.component.scss',
})
export class AscentListSkeletonComponent {}
