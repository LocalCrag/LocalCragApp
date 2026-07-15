import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { take } from 'rxjs/operators';
import { SkeletonModule } from 'primeng/skeleton';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingState } from '../../../enums/loading-state';
import { MenuPage } from '../../../models/menu-page';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { PageTitleService } from '../../../services/core/page-title.service';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';

@Component({
  selector: 'lc-menu-page-detail',
  imports: [SkeletonModule, SanitizeHtmlPipe],
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
  private pageTitleService = inject(PageTitleService);
  private title = inject(Title);
  private store = inject(Store);

  ngOnInit() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const menuPageSlug = this.route.snapshot.paramMap.get('menu-page-slug');
        this.menuPagesService.getMenuPage(menuPageSlug).subscribe({
          next: (menuPage) => {
            this.menuPage = menuPage;
            this.pageTitleService.setTitle(menuPage.title);
            this.store
              .pipe(select(selectInstanceName), take(1))
              .subscribe((instanceName) => {
                this.title.setTitle(`${menuPage.title} - ${instanceName}`);
              });
            this.loadingState = LoadingState.DEFAULT;
          },
          error: () => {
            this.router.navigate(['not-found']);
          },
        });
      });
  }
}
