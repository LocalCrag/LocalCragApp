import { AsyncPipe } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBan } from '@ng-icons/lucide';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import {
  ClosureReasonAlert,
  closureAlertMessage,
} from '../../../../models/closure-reason-alert';
import { ClosureBannerService } from '../../../../services/core/closure-banner.service';
import { LanguageService } from '../../../../services/core/language.service';

@Component({
  selector: 'lc-closure-banner',
  templateUrl: './closure-banner.component.html',
  styleUrl: './closure-banner.component.scss',
  imports: [AsyncPipe, NgIcon, TranslocoDirective],
  providers: [provideIcons({ lucideBan })],
})
export class ClosureBannerComponent implements AfterViewChecked {
  @ViewChildren('bannerMessage')
  private messages?: QueryList<ElementRef<HTMLElement>>;

  protected closureBannerService = inject(ClosureBannerService);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private overflows: boolean[] = [];
  private expanded: boolean[] = [];
  private measureScheduled = false;

  protected alertMessage(alert: ClosureReasonAlert): string {
    return closureAlertMessage(
      alert,
      (key, params) => this.translocoService.translate(key, params),
      this.languageService.calculatedLanguage,
    );
  }

  protected isOverflowing(index: number): boolean {
    return this.overflows[index] === true;
  }

  protected isExpanded(index: number): boolean {
    return this.expanded[index] === true;
  }

  protected toggle(index: number): void {
    this.expanded[index] = !this.expanded[index];
  }

  ngAfterViewChecked(): void {
    this.measure();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.measure();
  }

  private measure(): void {
    const messages = this.messages;
    if (!messages) {
      return;
    }
    let changed = false;
    messages.forEach((ref, index) => {
      if (this.expanded[index]) {
        return;
      }
      const element = ref.nativeElement;
      const overflows = element.scrollWidth > element.clientWidth + 1;
      if (this.overflows[index] !== overflows) {
        this.overflows[index] = overflows;
        changed = true;
      }
    });
    if (changed) {
      this.scheduleRender();
    }
  }

  private scheduleRender(): void {
    if (this.measureScheduled) {
      return;
    }
    this.measureScheduled = true;
    queueMicrotask(() => {
      this.measureScheduled = false;
      this.changeDetectorRef.detectChanges();
    });
  }
}
