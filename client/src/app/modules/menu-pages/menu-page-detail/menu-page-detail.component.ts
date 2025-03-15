import { Component, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { MenuPage } from '../../../models/menu-page';
import { SharedModule } from '../../shared/shared.module';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingState } from '../../../enums/loading-state';
import { NgIf } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@Component({
  selector: 'lc-menu-page-detail',
  imports: [CardModule, SharedModule, NgIf, SkeletonModule],
  templateUrl: './menu-page-detail.component.html',
  styleUrl: './menu-page-detail.component.scss',
})
@UntilDestroy()
export class MenuPageDetailComponent implements OnInit {
  public menuPage: MenuPage;
  public loadingState = LoadingState.LOADING;

  constructor(
    private menuPagesService: MenuPagesService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(untilDestroyed(this)).subscribe(() => {
      const menuPageSlug = this.route.snapshot.paramMap.get('menu-page-slug');
      this.menuPagesService.getMenuPage(menuPageSlug).subscribe(
        (menuPage) => {
          this.menuPage = menuPage;
          this.loadingState = LoadingState.DEFAULT;
        },
        () => {
          this.router.navigate(['not-found']);
        },
      );
    });
  }
}
