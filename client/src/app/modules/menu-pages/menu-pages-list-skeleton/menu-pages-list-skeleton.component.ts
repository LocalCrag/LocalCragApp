import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { Skeleton } from 'primeng/skeleton';

@Component({
  selector: 'lc-menu-pages-list-skeleton',
  imports: [NgForOf, Skeleton],
  templateUrl: './menu-pages-list-skeleton.component.html',
  styleUrl: './menu-pages-list-skeleton.component.scss',
})
export class MenuPagesListSkeletonComponent {}
