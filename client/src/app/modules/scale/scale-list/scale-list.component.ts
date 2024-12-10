import { Component, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslocoDirective, TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DataViewModule } from 'primeng/dataview';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';
import { NgClass, NgForOf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { RatingModule } from 'primeng/rating';
import { SharedModule } from '../../shared/shared.module';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'lc-scale-list',
  standalone: true,
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
    SharedModule,
    TagModule,
    NgClass,
    CardModule,
    TranslocoPipe
  ]
})
@UntilDestroy()
export class ScaleListComponent implements OnInit {
  public loadingState: LoadingState;
  public scales: Scale[] = null;

  constructor(
    private scalesService: ScalesService,
    private translocoService: TranslocoService,
    protected router: Router,
  ) {}

  ngOnInit() {
    this.loadingState = LoadingState.LOADING;
    this.scalesService.getScales().subscribe(scales => {
      this.scales = scales.sort((a, b) =>
        a.lineType.localeCompare(b.lineType) ? a.lineType.localeCompare(b.lineType) : a.name.localeCompare(b.name)
      );
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected readonly LoadingState = LoadingState;
}
