import { Component, OnInit, inject } from '@angular/core';
import { ScalesService } from '../../../services/crud/scales.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { TableModule } from 'primeng/table';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';

import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ScaleListSkeletonComponent } from '../scale-list-skeleton/scale-list-skeleton.component';
import { Message } from 'primeng/message';
import { PageTitleService } from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-scale-list',
  templateUrl: './scale-list.component.html',
  styleUrl: './scale-list.component.scss',
  imports: [
    TranslocoDirective,
    TableModule,
    RouterLink,
    ButtonModule,
    TranslocoPipe,
    ScaleListSkeletonComponent,
    Message,
  ],
})
export class ScaleListComponent implements OnInit {
  public loadingState: LoadingState;
  public scales: Scale[] = null;

  private scalesService = inject(ScalesService);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  protected router = inject(Router);

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate('scale.scaleList.editScales'),
    );
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
