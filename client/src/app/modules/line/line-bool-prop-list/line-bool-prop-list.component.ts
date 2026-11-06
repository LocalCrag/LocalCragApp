import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  SimpleChange,
  inject,
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
  imports: [TranslocoDirective, TranslocoPipe],
  hostDirectives: [Tooltip],
})
export class LineBoolPropListComponent implements AfterViewInit, OnDestroy {
  @Input() line: Line;

  private elementRef = inject(ElementRef<HTMLElement>);
  private zone = inject(NgZone);
  private tooltip = inject(Tooltip);
  private mutationObserver: MutationObserver;
  private fullLabel = '';

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
    // PrimeNG only copies these fields into the overlay options from ngOnChanges.
    this.tooltip.content = label;
    this.tooltip.showOnEllipsis = true;
    this.tooltip.tooltipPosition = 'top';
    this.tooltip.ngOnChanges({
      content: new SimpleChange(undefined, label, false),
      showOnEllipsis: new SimpleChange(undefined, true, false),
      tooltipPosition: new SimpleChange(undefined, 'top', false),
    });
  }
}
