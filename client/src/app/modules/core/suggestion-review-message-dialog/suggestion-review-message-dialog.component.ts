import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { LinePath } from '../../../models/line-path';
import { TopoImage } from '../../../models/topo-image';
import { NotificationSuggestionReviewSubject } from '../../../models/notification-item';
import { TopoImageViewerComponent } from '../../shared/components/topo-image/topo-image-viewer.component';

const REJECTED_BECAUSE_ARCHIVED = marker(
  'suggestionReview.dialog.rejectedBecauseArchived',
);
const REJECTED_BECAUSE_TOPO_IMAGE_ARCHIVED = marker(
  'suggestionReview.dialog.rejectedBecauseTopoImageArchived',
);

export function suggestionReviewDisplayMessage(
  message: string,
  translate: TranslocoService,
): string {
  const systemMessage = parseArchiveRejectionMessage(message);
  if (systemMessage?.key === REJECTED_BECAUSE_ARCHIVED) {
    return translate.translate(REJECTED_BECAUSE_ARCHIVED, {
      name: systemMessage.name ?? '',
    });
  }
  if (systemMessage?.key === REJECTED_BECAUSE_TOPO_IMAGE_ARCHIVED) {
    return translate.translate(REJECTED_BECAUSE_TOPO_IMAGE_ARCHIVED);
  }
  return message;
}

function parseArchiveRejectionMessage(
  message: string,
): { key?: string; name?: string } | null {
  if (!message.startsWith('{')) {
    return null;
  }
  try {
    const payload = JSON.parse(message) as { key?: unknown; name?: unknown };
    if (typeof payload.key !== 'string') {
      return null;
    }
    return {
      key: payload.key,
      name: typeof payload.name === 'string' ? payload.name : undefined,
    };
  } catch {
    return null;
  }
}

export interface SuggestionReviewMessageDialogData {
  message: string;
  targetLink: string | null;
  subject: NotificationSuggestionReviewSubject | null;
}

@Component({
  selector: 'lc-suggestion-review-message-dialog',
  imports: [ButtonModule, TranslocoDirective, TopoImageViewerComponent],
  templateUrl: './suggestion-review-message-dialog.component.html',
  styleUrl: './suggestion-review-message-dialog.component.scss',
})
export class SuggestionReviewMessageDialogComponent {
  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);

  public readonly message: string = suggestionReviewDisplayMessage(
    this.config.data?.message ?? '',
    this.translocoService,
  );
  public readonly targetLink: string | null =
    this.config.data?.targetLink ?? null;
  public readonly subject: NotificationSuggestionReviewSubject | null =
    this.config.data?.subject ?? null;
  public readonly linePreview: TopoImage | null = this.buildLinePreview();
  public readonly imagePreview: TopoImage | null = this.buildImagePreview();
  public readonly lineColor: string | null = this.subject?.color ?? null;

  public close(): void {
    this.ref.close();
  }

  public viewDetails(): void {
    const link = this.targetLink;
    this.ref.close();
    if (link) {
      void this.router.navigateByUrl(link);
    }
  }

  public location(): string {
    const subject = this.subject;
    if (!subject) {
      return '';
    }
    return [subject.cragName, subject.sectorName, subject.areaName]
      .filter(Boolean)
      .join(' / ');
  }

  private buildLinePreview(): TopoImage | null {
    const subject = this.config.data?.subject as
      NotificationSuggestionReviewSubject | null | undefined;
    if (subject?.kind !== 'line') {
      return null;
    }
    const firstPath = subject.linePaths?.[0] as
      { topoImage?: unknown } | undefined;
    if (!firstPath?.topoImage) {
      return null;
    }
    const linePath = LinePath.deserialize(firstPath);
    const topoImage = TopoImage.deserialize(firstPath.topoImage);
    topoImage.linePaths = [linePath];
    return topoImage;
  }

  private buildImagePreview(): TopoImage | null {
    const subject = this.config.data?.subject as
      NotificationSuggestionReviewSubject | null | undefined;
    if (subject?.kind !== 'topoImage' || !subject.image) {
      return null;
    }
    const preview = TopoImage.deserialize(subject.image);
    preview.linePaths = [];
    preview.tabuAreas = [];
    return preview;
  }
}
