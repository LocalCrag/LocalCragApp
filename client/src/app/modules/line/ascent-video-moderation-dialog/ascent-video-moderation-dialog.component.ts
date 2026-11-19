import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { Video } from '../../../models/video';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AscentsService } from '../../../services/crud/ascents.service';
import { providerForUrl } from '../../../utility/video-source';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

const MAX_START_SECONDS = 24 * 60 * 60;
const MAX_MESSAGE_LENGTH = 2000;

export interface AscentVideoModerationData {
  ascentId: string;
  video: Video | null;
}

export function openAscentVideoModerationDialog(
  dialogService: HlmDialogService,
  transloco: TranslocoService,
  data: AscentVideoModerationData,
): BrnDialogRef<Video | null> {
  return dialogService.open(AscentVideoModerationDialogComponent, {
    title: transloco.translate(marker('line.line.editAscentVideos')),
    contentClass: 'sm:max-w-lg',
    context: {
      ascentId: data.ascentId,
      video: data.video ? { ...data.video } : null,
    },
  });
}

@Component({
  selector: 'lc-ascent-video-moderation-dialog',
  templateUrl: './ascent-video-moderation-dialog.component.html',
  styleUrl: './ascent-video-moderation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    LoadingButtonComponent,
    FormsModule,
    TranslocoDirective,
    HlmButton,
    HlmInput,
    HlmTextarea,
  ],
})
export class AscentVideoModerationDialogComponent {
  public draft: Video | null = null;
  public saving = false;
  public startInvalid = false;
  public removing = false;
  public message = '';
  public readonly maxMessageLength = MAX_MESSAGE_LENGTH;

  private dialogContext = injectBrnDialogContext<AscentVideoModerationData>();
  private ref = inject(BrnDialogRef<Video | null>);
  private ascentsService = inject(AscentsService);
  private store = inject(Store);

  constructor() {
    const data = this.dialogContext;
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
    const ascentId = this.dialogContext.ascentId;
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
