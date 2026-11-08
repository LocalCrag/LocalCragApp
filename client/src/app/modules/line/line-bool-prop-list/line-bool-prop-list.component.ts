import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Line } from '../../../models/line';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { Tooltip } from 'primeng/tooltip';

/**
 * Component that lists boolean properties of lines in text form.
 * When the list is clipped, hovering it shows the full text.
 */
@Component({
  selector: 'lc-line-bool-prop-list',
  templateUrl: './line-bool-prop-list.component.html',
  styleUrls: ['./line-bool-prop-list.component.scss'],
  imports: [TranslocoDirective, TranslocoPipe, Tooltip],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class LineBoolPropListComponent implements AfterViewInit, OnDestroy {
  @Input() line: Line;

  private elementRef = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private mutationObserver: MutationObserver;
  protected fullLabel = '';

  ngAfterViewInit() {
    const host = this.elementRef.nativeElement;
    const update = () => this.zone.run(() => this.refreshLabel());
    this.mutationObserver = new MutationObserver(update);
    this.mutationObserver.observe(host, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    this.refreshLabel();
  }

  ngOnDestroy() {
    this.mutationObserver?.disconnect();
  }

  private refreshLabel() {
    const label = [
      ...this.elementRef.nativeElement.querySelectorAll(':scope > span'),
    ]
      .map((span) => (span.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter((text) => text.length > 0)
      .join(', ');
    if (label === this.fullLabel) {
      return;
    }
    this.fullLabel = label;
  }
}
