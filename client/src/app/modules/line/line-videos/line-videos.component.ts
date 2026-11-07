import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DialogService } from 'primeng/dynamicdialog';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError, switchMap, take } from 'rxjs/operators';
import { EMPTY, forkJoin, throwError } from 'rxjs';
import { AscentVideoGroup, Line } from '../../../models/line';
import { Video } from '../../../models/video';
import { LinesService } from '../../../services/crud/lines.service';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import {
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { VideoPlayerComponent } from '../../shared/components/video-player/video-player.component';
import { openAscentVideoModerationDialog } from '../ascent-video-moderation-dialog/ascent-video-moderation-dialog.component';
import { withAssumedGradeRange } from '../../../utility/grade/assumed-grade-label';
import {
  formatVideoStart,
  providerForUrl,
} from '../../../utility/video-source';

interface PlayableVideo {
  key: string;
  kind: 'line' | 'ascent';
  title: string;
  url: string;
  source: string | null;
  fileId: string | null;
  startSeconds: number | null;
  badge: string;
  climberName: string | null;
  climberLink: string | null;
  ascentId: string | null;
  indexInAscent: number | null;
}

@Component({
  selector: 'lc-line-videos',
  templateUrl: './line-videos.component.html',
  styleUrl: './line-videos.component.scss',
  providers: [DialogService],
  imports: [
    TranslocoDirective,
    VideoPlayerComponent,
    HasPermissionDirective,
    RouterLink,
  ],
})
export class LineVideosComponent implements OnInit {
  line: Line;

  selectedKey: string | null = null;
  private requestedAscentId: string | null = null;

  private dialogService = inject(DialogService);
  private linesService = inject(LinesService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private scalesService = inject(ScalesService);
  private translateSpecialGradesService = inject(TranslateSpecialGradesService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.requestedAscentId = params.get('ascent');
        this.selectRequestedAscent();
      });

    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.line = undefined;
        this.selectedKey = null;
        const lineSlug =
          this.route.parent.parent.snapshot.paramMap.get('line-slug');
        this.linesService
          .getLine(lineSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
                return EMPTY;
              }
              return throwError(() => e);
            }),
          )
          .subscribe((line) => {
            this.line = line;
            this.selectRequestedAscent();
            this.setPageTitle(line);
          });
      });
  }

  private setPageTitle(line: Line) {
    forkJoin([
      this.store.pipe(select(selectInstanceSettingsState), take(1)),
      this.store.select(selectInstanceName).pipe(take(1)),
    ]).subscribe(([instanceSettings, instanceName]) => {
      const gradeValue = instanceSettings.displayUserGrades
        ? line.userGradeValue
        : line.authorGradeValue;
      this.scalesService
        .gradeNameByValue(line.type, line.gradeScale, gradeValue)
        .pipe(
          switchMap((gradeName) =>
            withAssumedGradeRange(
              this.scalesService,
              line,
              gradeValue,
              this.translateSpecialGradesService.translate(gradeName),
            ),
          ),
          take(1),
        )
        .subscribe((displayGrade) => {
          this.title.setTitle(
            `${line.name} ${displayGrade} / ${this.translocoService.translate(marker('line.videos'))} - ${instanceName}`,
          );
        });
    });
  }

  get items(): PlayableVideo[] {
    const lineVideos = (this.line?.videos ?? []).map((video, index) =>
      this.lineVideo(video, index),
    );
    const ascentVideos = (this.line?.ascentVideos ?? [])
      .map((group) => this.ascentVideo(group))
      .filter((item): item is PlayableVideo => item !== null);
    return [...lineVideos, ...ascentVideos];
  }

  get selected(): PlayableVideo | null {
    const items = this.items;
    if (!items.length) {
      return null;
    }
    return items.find((item) => item.key === this.selectedKey) ?? items[0];
  }

  select(item: PlayableVideo) {
    this.selectedKey = item.key;
  }

  private selectRequestedAscent() {
    if (!this.line || !this.requestedAscentId) {
      return;
    }
    const match = this.items.find(
      (item) => item.ascentId === this.requestedAscentId,
    );
    if (match) {
      this.selectedKey = match.key;
    }
  }

  openModeration(video: PlayableVideo) {
    if (!video.ascentId) {
      return;
    }
    const ref = openAscentVideoModerationDialog(
      this.dialogService,
      this.translocoService,
      {
        ascentId: video.ascentId,
        video: this.videoForAscent(video.ascentId),
      },
    );
    ref?.onClose.pipe(take(1)).subscribe((next: Video | null | undefined) => {
      if (next === undefined || !video.ascentId) {
        return;
      }
      const removed = next?.url !== video.url;
      this.replaceAscentVideo(video.ascentId, next);
      if (removed) {
        this.selectedKey = null;
      }
    });
  }

  startLabel(seconds: number | null): string | null {
    return formatVideoStart(seconds);
  }

  private resolvedSource(video: Video): string | null {
    if (video.source === 'upload' || video.fileId) {
      return 'upload';
    }
    return providerForUrl(video.url) ?? video.source ?? null;
  }

  sourceIcon(source: string | null): string {
    switch (source) {
      case 'youtube':
        return 'pi pi-youtube';
      case 'vimeo':
        return 'pi pi-vimeo';
      case 'instagram':
        return 'pi pi-instagram';
      case 'upload':
        return 'pi pi-video';
      default:
        return 'pi pi-link';
    }
  }

  private lineVideo(video: Video, index: number): PlayableVideo {
    return {
      key: `line-${index}-${video.url}`,
      kind: 'line',
      title: video.title,
      url: video.url,
      source: this.resolvedSource(video),
      fileId: video.fileId ?? null,
      startSeconds: video.startSeconds ?? null,
      badge: 'line',
      climberName: null,
      climberLink: null,
      ascentId: null,
      indexInAscent: null,
    };
  }

  private ascentVideo(group: AscentVideoGroup): PlayableVideo | null {
    const video = group.video;
    if (!video) {
      return null;
    }
    const climberName = [group.user?.firstname, group.user?.lastname]
      .filter(Boolean)
      .join(' ');
    return {
      key: `ascent-${group.ascentId}-${video.url}`,
      kind: 'ascent',
      title: video.title,
      url: video.url,
      source: this.resolvedSource(video),
      fileId: null,
      startSeconds: video.startSeconds ?? null,
      badge: 'ascent',
      climberName: climberName || null,
      climberLink: group.user?.slug ? `/users/${group.user.slug}` : null,
      ascentId: group.ascentId,
      indexInAscent: null,
    };
  }

  private videoForAscent(ascentId: string) {
    const group = (this.line.ascentVideos ?? []).find(
      (item) => item.ascentId === ascentId,
    );
    return group?.video ?? null;
  }

  private replaceAscentVideo(ascentId: string, video: Video | null) {
    this.line.ascentVideos = (this.line.ascentVideos ?? [])
      .map((group) =>
        group.ascentId === ascentId ? { ...group, video } : group,
      )
      .filter((group) => group.video != null);
  }
}
