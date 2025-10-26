import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { MenuPage } from '../../../models/menu-page';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingState } from '../../../enums/loading-state';

import { SkeletonModule } from 'primeng/skeleton';

import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-menu-page-detail',
  imports: [CardModule, SkeletonModule, SanitizeHtmlPipe],
  templateUrl: './menu-page-detail.component.html',
  styleUrl: './menu-page-detail.component.scss',
})
export class MenuPageDetailComponent implements OnInit {
  public menuPage: MenuPage;
  public loadingState = LoadingState.LOADING;

  private destroyRef = inject(DestroyRef);
  private menuPagesService = inject(MenuPagesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const menuPageSlug = this.route.snapshot.paramMap.get('menu-page-slug');
        this.menuPagesService.getMenuPage(menuPageSlug).subscribe({
          next: (menuPage) => {
            this.menuPage = menuPage;
            this.loadingState = LoadingState.DEFAULT;
          },
          error: () => {
            this.router.navigate(['not-found']);
          },
        });
      });
  }
}
