import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-menu-list-skeleton',
  imports: [NgForOf, Skeleton],
  templateUrl: './menu-list-skeleton.component.html',
  styleUrl: './menu-list-skeleton.component.scss',
})
export class MenuPagesListSkeletonComponent {}
