import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';
import { OfflineAlertComponent } from '../offline-alert/offline-alert.component';
import { StorageAccessAlertComponent } from '../storage-access-alert/storage-access-alert.component';

/**
 * Fixed stack of document-level banners above the site header.
 *
 * The storage-access and offline banners are independent. This host only
 * places them and publishes their combined height as `--lc-top-alerts-height`,
 * which the header and full-height layouts use as a top offset.
 */
@Component({
  selector: 'lc-top-alerts',
  templateUrl: './top-alerts.component.html',
  styleUrls: ['./top-alerts.component.scss'],
  imports: [StorageAccessAlertComponent, OfflineAlertComponent],
})
export class TopAlertsComponent implements AfterViewInit, OnDestroy {
  private hostEl = inject(ElementRef<HTMLElement>);
  private resizeObserver?: ResizeObserver;

  constructor() {
    afterNextRender(() => this.updateHeight());
  }

  ngAfterViewInit() {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.updateHeight());
    this.resizeObserver.observe(this.hostEl.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    document.documentElement.style.setProperty('--lc-top-alerts-height', '0px');
  }

  private updateHeight() {
    const height = this.hostEl.nativeElement.offsetHeight ?? 0;
    document.documentElement.style.setProperty(
      '--lc-top-alerts-height',
      `${height}px`,
    );
  }
}
