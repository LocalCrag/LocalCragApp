import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { Button } from 'primeng/button';
import {
  DialogService,
  DynamicDialogConfig,
  DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Video } from '../../../models/video';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AscentsService } from '../../../services/crud/ascents.service';
import { providerForUrl } from '../../../utility/video-source';

const MAX_START_SECONDS = 24 * 60 * 60;
const MAX_MESSAGE_LENGTH = 2000;

export interface AscentVideoModerationData {
  ascentId: string;
  video: Video | null;
}

export function openAscentVideoModerationDialog(
  dialogService: DialogService,
  transloco: TranslocoService,
  data: AscentVideoModerationData,
): DynamicDialogRef {
  return dialogService.open(AscentVideoModerationDialogComponent, {
    modal: true,
    header: transloco.translate(marker('line.line.editAscentVideos')),
    width: '32rem',
    breakpoints: { '640px': '95vw' },
    dismissableMask: true,
    closeOnEscape: true,
    data: {
      ascentId: data.ascentId,
      video: data.video ? { ...data.video } : null,
    },
  });
}

@Component({
  selector: 'lc-ascent-video-moderation-dialog',
  templateUrl: './ascent-video-moderation-dialog.component.html',
  styleUrl: './ascent-video-moderation-dialog.component.scss',
  imports: [FormsModule, TranslocoDirective, Button, InputText, Textarea],
})
export class AscentVideoModerationDialogComponent {
  public draft: Video | null = null;
  public saving = false;
  public startInvalid = false;
  public removing = false;
  public message = '';
  public readonly maxMessageLength = MAX_MESSAGE_LENGTH;

  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private ascentsService = inject(AscentsService);
  private store = inject(Store);

  constructor() {
    const data = this.config.data as AscentVideoModerationData;
    this.draft = data.video ? { ...data.video } : null;
  }

  public allowsStart(video: Video): boolean {
    const provider =
      video.source === 'upload' || video.fileId
        ? 'upload'
        : (providerForUrl(video.url) ?? video.source);
    return provider !== 'instagram';
  }

  public startRemove(): void {
    this.removing = true;
    this.startInvalid = false;
    this.message = '';
  }

  public cancel(): void {
    if (this.removing) {
      this.removing = false;
      this.message = '';
      return;
    }
    this.ref.close();
  }

  public save(): void {
    if (this.saving) {
      return;
    }
    const video = this.removing ? null : this.cleanedVideo();
    if (video === undefined) {
      this.startInvalid = true;
      return;
    }
    this.startInvalid = false;
    this.saving = true;
    const ascentId = (this.config.data as AscentVideoModerationData).ascentId;
    const message = this.removing ? this.message.trim() || null : null;
    this.ascentsService.updateAscentVideo(ascentId, video, message).subscribe({
      next: (ascent) => {
        this.ref.close(ascent.video);
      },
      error: () => {
        this.saving = false;
        this.store.dispatch(toastNotification('UNKNOWN_ERROR'));
      },
    });
  }

  private cleanedVideo(): Video | null | undefined {
    if (!this.draft) {
      return null;
    }
    const startSeconds = this.cleanStart(this.draft);
    if (startSeconds === undefined) {
      return undefined;
    }
    return Video.deserialize({
      url: this.draft.url,
      title: this.draft.title,
      startSeconds,
    });
  }

  private cleanStart(video: Video): number | null | undefined {
    if (!this.allowsStart(video)) {
      return null;
    }
    const value = video.startSeconds as number | string | null | undefined;
    if (value == null || value === '') {
      return null;
    }
    const parsed = Number(value);
    if (
      !Number.isFinite(parsed) ||
      !Number.isInteger(parsed) ||
      parsed < 0 ||
      parsed > MAX_START_SECONDS
    ) {
      return undefined;
    }
    return parsed > 0 ? parsed : null;
  }
}
