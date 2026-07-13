import { Component, OnInit, inject } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterOutlet } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { PageTitleService } from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-ascents',
  imports: [BreadcrumbModule, RouterOutlet, TranslocoDirective],
  templateUrl: './ascents.component.html',
  styleUrl: './ascents.component.scss',
})
export class AscentsComponent implements OnInit {
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(marker('ascents.ascents.ascents')),
    );
  }
}
