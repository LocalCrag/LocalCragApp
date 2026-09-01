import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Tooltip } from 'primeng/tooltip';
import { LinePathFormComponent } from '../line-path-form/line-path-form.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PageTitleService } from '../../../services/core/page-title.service';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';

@Component({
  selector: 'lc-line-path-form-wrapper',
  imports: [LinePathFormComponent, TranslocoDirective, Tooltip, AsyncPipe],
  templateUrl: './line-path-form-wrapper.component.html',
  styleUrl: './line-path-form-wrapper.component.scss',
})
export class LinePathFormWrapperComponent implements OnInit {
  public isMobile$: Observable<boolean>;

  private store = inject(Store);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  /** t(linePath.linePathForm.manageLinePathsTitle) */
  ngOnInit(): void {
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        'linePath.linePathForm.manageLinePathsTitle',
      ),
    );
  }
}
