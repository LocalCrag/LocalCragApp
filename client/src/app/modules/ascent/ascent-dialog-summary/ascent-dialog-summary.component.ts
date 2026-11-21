import { AsyncPipe } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendar,
  lucideCheck,
  lucideChevronsDown,
  lucideChevronsUp,
  lucideStar,
  lucideTicket,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { Ascent } from '../../../models/ascent';
import { ScalesService } from '../../../services/crud/scales.service';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { TopoHierarchyBreadcrumbsComponent } from '../../shared/components/topo-hierarchy-breadcrumbs/topo-hierarchy-breadcrumbs.component';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { UpgradePipe } from '../pipes/upgrade.pipe';
import { DowngradePipe } from '../pipes/downgrade.pipe';
import { ConsensusGradePipe } from '../pipes/consensus-grade.pipe';

@Component({
  selector: 'lc-ascent-dialog-summary',
  imports: [
    TranslocoDirective,
    UserAvatarComponent,
    TopoHierarchyBreadcrumbsComponent,
    RouterLink,
    NgIcon,
    HlmBadge,
    AsyncPipe,
    DatePipe,
    TranslateSpecialGradesPipe,
    LineGradePipe,
    UpgradePipe,
    DowngradePipe,
    ConsensusGradePipe,
  ],
  templateUrl: './ascent-dialog-summary.component.html',
  styleUrl: './ascent-dialog-summary.component.scss',
  providers: [
    provideIcons({
      lucideCalendar,
      lucideCheck,
      lucideChevronsDown,
      lucideChevronsUp,
      lucideStar,
      lucideTicket,
      lucideZap,
    }),
  ],
})
export class AscentDialogSummaryComponent {
  @Input({ required: true }) ascent!: Ascent;

  protected scalesService = inject(ScalesService);
}
