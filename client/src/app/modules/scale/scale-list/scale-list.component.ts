import { Component, OnInit, inject } from '@angular/core';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { DataViewModule } from 'primeng/dataview';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';
import { NgForOf, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { RatingModule } from 'primeng/rating';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ScaleListSkeletonComponent } from '../scale-list-skeleton/scale-list-skeleton.component';
import { Message } from 'primeng/message';

@Component({
  selector: 'lc-scale-list',
  templateUrl: './scale-list.component.html',
  styleUrl: './scale-list.component.scss',
  imports: [
    TranslocoDirective,
    DataViewModule,
    NgForOf,
    RouterLink,
    AvatarModule,
    ButtonModule,
    MenuModule,
    RatingModule,
    TagModule,
    CardModule,
    TranslocoPipe,
    NgIf,
    ScaleListSkeletonComponent,
    Message,
  ],
})
export class ScaleListComponent implements OnInit {
  public loadingState: LoadingState;
  public scales: Scale[] = null;

  private scalesService = inject(ScalesService);

  protected router = inject(Router);

  ngOnInit() {
    this.loadingState = LoadingState.LOADING;
    this.scalesService.getScales().subscribe((scales) => {
      this.scales = scales.sort((a, b) =>
        a.lineType.localeCompare(b.lineType)
          ? a.lineType.localeCompare(b.lineType)
          : a.name.localeCompare(b.name),
      );
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected readonly LoadingState = LoadingState;
}
