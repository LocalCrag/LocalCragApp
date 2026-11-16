import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ScalesService } from '../../../services/crud/scales.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { LoadingState } from '../../../enums/loading-state';
import { Scale } from '../../../models/scale';

import { Router, RouterLink } from '@angular/router';
import { ScaleListSkeletonComponent } from '../scale-list-skeleton/scale-list-skeleton.component';
import { PageTitleService } from '../../../services/core/page-title.service';
import { LineType } from '../../../enums/line-type';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideFilePen,
  lucideInfo,
  lucidePlus,
  lucideStar,
} from '@ng-icons/lucide';

@Component({
  providers: [
    provideIcons({ lucideFilePen, lucideInfo, lucidePlus, lucideStar }),
  ],
  selector: 'lc-scale-list',
  templateUrl: './scale-list.component.html',
  styleUrl: './scale-list.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    TranslocoDirective,
    RouterLink,
    TranslocoPipe,
    ScaleListSkeletonComponent,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    HlmTooltip,
    NgIcon,
  ],
})
export class ScaleListComponent implements OnInit {
  public loadingState: LoadingState;
  public scalesByType: Record<LineType, Scale[]> = {
    [LineType.BOULDER]: [],
    [LineType.SPORT]: [],
    [LineType.TRAD]: [],
  };
  public makingDefault = false;
  public readonly lineTypes = [LineType.BOULDER, LineType.SPORT, LineType.TRAD];

  private scalesService = inject(ScalesService);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(marker('scale.scaleList.editScales')),
    );
    this.loadingState = LoadingState.LOADING;
    this.scalesService.getScales().subscribe((scales) => {
      this.groupScales(scales);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  createScale(lineType: LineType) {
    this.router.navigate(['/scales/create'], {
      queryParams: { type: lineType },
    });
  }

  makeDefault(scale: Scale) {
    if (scale.isDefault || this.makingDefault) {
      return;
    }
    this.makingDefault = true;
    this.scalesService.setDefault(scale).subscribe({
      next: () => {
        this.scalesByType[scale.lineType].forEach((item) => {
          item.isDefault = item.name === scale.name;
        });
        this.makingDefault = false;
      },
      error: () => {
        this.makingDefault = false;
      },
    });
  }

  private groupScales(scales: Scale[]) {
    for (const lineType of this.lineTypes) {
      this.scalesByType[lineType] = this.sorted(
        scales.filter((scale) => scale.lineType === lineType),
      );
    }
  }

  private sorted(scales: Scale[]): Scale[] {
    return scales.sort((a, b) => a.name.localeCompare(b.name));
  }

  protected readonly LoadingState = LoadingState;
}
