import { Component, OnInit, inject } from '@angular/core';
import { LinePathFormComponent } from '../line-path-form/line-path-form.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PageTitleService } from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-line-path-form-wrapper',
  imports: [LinePathFormComponent, TranslocoDirective],
  templateUrl: './line-path-form-wrapper.component.html',
  styleUrl: './line-path-form-wrapper.component.scss',
})
export class LinePathFormWrapperComponent implements OnInit {
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  /** t(linePath.linePathForm.addLinePathTitle) */
  ngOnInit(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate('linePath.linePathForm.addLinePathTitle'),
    );
  }
}
