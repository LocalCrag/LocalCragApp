import {Component, OnInit} from '@angular/core';
import {CardModule} from 'primeng/card';
import {TranslocoDirective} from '@ngneat/transloco';
import {MenuPage} from '../../../models/menu-page';
import {SharedModule} from '../../shared/shared.module';
import {MenuPagesService} from '../../../services/crud/menu-pages.service';
import {ActivatedRoute, Router} from '@angular/router';
import {LoadingState} from '../../../enums/loading-state';
import {NgIf} from '@angular/common';
import {SkeletonModule} from 'primeng/skeleton';

@Component({
  selector: 'lc-menu-page-detail',
  standalone: true,
  imports: [
    CardModule,
    TranslocoDirective,
    SharedModule,
    NgIf,
    SkeletonModule
  ],
  templateUrl: './menu-page-detail.component.html',
  styleUrl: './menu-page-detail.component.scss'
})
export class MenuPageDetailComponent implements OnInit{

  public menuPage: MenuPage;
  public loadingState = LoadingState.LOADING;

  constructor(private menuPagesService: MenuPagesService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const menuPageSlug = this.route.snapshot.paramMap.get('menu-page-slug');
    this.menuPagesService.getMenuPage(menuPageSlug).subscribe(menuPage => {
      this.menuPage = menuPage;
      this.loadingState = LoadingState.DEFAULT;
    }, ()=>{
      this.router.navigate(['not-found']);
    });
  }

}
