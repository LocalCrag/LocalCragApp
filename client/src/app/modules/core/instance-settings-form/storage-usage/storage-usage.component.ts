import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective } from '@jsverse/transloco';
import { MeterGroup } from 'primeng/metergroup';
import { Skeleton } from 'primeng/skeleton';
import {
  InstanceSettingsService,
  StorageUsage,
} from '../../../../services/crud/instance-settings.service';

interface StorageSegment {
  key: 'videos' | 'gallery' | 'topo' | 'other';
  bytes: number;
  color: string;
}

@Component({
  selector: 'lc-storage-usage',
  imports: [TranslocoDirective, MeterGroup, Skeleton],
  templateUrl: './storage-usage.component.html',
  styleUrl: './storage-usage.component.scss',
})
export class StorageUsageComponent implements OnInit {
  private instanceSettingsService = inject(InstanceSettingsService);
  private destroyRef = inject(DestroyRef);

  public loading = signal(true);
  public failed = signal(false);
  public usage = signal<StorageUsage | null>(null);

  private readonly colors = {
    videos: 'var(--p-blue-500)',
    gallery: 'var(--p-green-500)',
    topo: 'var(--p-orange-500)',
    other: 'var(--p-purple-500)',
  };

  ngOnInit(): void {
    this.instanceSettingsService
      .getStorageUsage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usage) => {
          this.usage.set(usage);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  segments(): StorageSegment[] {
    const usage = this.usage();
    return [
      { key: 'videos', bytes: usage?.videos ?? 0, color: this.colors.videos },
      {
        key: 'gallery',
        bytes: usage?.galleryImages ?? 0,
        color: this.colors.gallery,
      },
      { key: 'topo', bytes: usage?.topoImages ?? 0, color: this.colors.topo },
      { key: 'other', bytes: usage?.other ?? 0, color: this.colors.other },
    ];
  }

  meters(): { value: number; color: string }[] {
    return this.segments().map((segment) => ({
      value: segment.bytes,
      color: segment.color,
    }));
  }

  used(): number {
    return this.segments().reduce((total, segment) => total + segment.bytes, 0);
  }

  scale(): number {
    const capacity = this.usage()?.capacity;
    if (capacity && capacity > 0) {
      return Math.max(capacity, this.used());
    }
    return Math.max(this.used(), 1);
  }

  available(): number {
    const capacity = this.usage()?.capacity ?? 0;
    return Math.max(capacity - this.used(), 0);
  }

  /**
   * Free space rounded so it does not display as the same size as the disk
   * while some of that disk is already in use.
   */
  formatFreeBytes(): string {
    const free = this.available();
    const capacity = this.usage()?.capacity ?? 0;
    let digits = 1;
    let label = this.formatBytes(free, digits);
    while (
      this.used() > 0 &&
      label === this.formatBytes(capacity, digits) &&
      digits < 2
    ) {
      digits += 1;
      label = this.formatBytes(free, digits);
    }
    return label;
  }

  formatBytes(bytes: number, fractionDigits?: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes / 1024;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    const digits = fractionDigits ?? (value >= 100 ? 0 : 1);
    const formatted = value.toLocaleString(undefined, {
      maximumFractionDigits: digits,
      minimumFractionDigits: fractionDigits === undefined ? 0 : digits,
    });
    return `${formatted} ${units[unitIndex]}`;
  }
}
