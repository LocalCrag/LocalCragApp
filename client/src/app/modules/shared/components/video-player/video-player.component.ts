import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslocoDirective } from '@jsverse/transloco';
import { videoEmbed } from '../../../../utility/video-source';

@Component({
  selector: 'lc-video-player',
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss',
  imports: [TranslocoDirective],
})
export class VideoPlayerComponent implements OnChanges {
  @Input({ required: true }) url: string;
  @Input() title = '';
  @Input() source: string | null = null;
  @Input() fileId: string | null = null;
  @Input() startSeconds: number | null = null;

  @ViewChild('playback') playback?: ElementRef<HTMLVideoElement>;

  embedUrl: SafeResourceUrl | null = null;
  provider: 'youtube' | 'vimeo' | 'instagram' | 'upload' | 'link' = 'link';
  appliedStart = 0;

  private sanitizer = inject(DomSanitizer);

  ngOnChanges() {
    const embed = videoEmbed({
      url: this.url,
      source: this.source,
      fileId: this.fileId,
      startSeconds: this.startSeconds,
    });
    this.provider = embed.provider;
    this.appliedStart = embed.startSeconds;
    this.embedUrl = embed.embedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(embed.embedUrl)
      : null;
    this.seekPlayback();
  }

  onPlaybackReady() {
    this.seekPlayback();
  }

  private seekPlayback() {
    const element = this.playback?.nativeElement;
    if (!element || this.provider !== 'upload' || this.appliedStart <= 0) {
      return;
    }
    if (element.readyState >= 1) {
      element.currentTime = this.appliedStart;
    }
  }
}
