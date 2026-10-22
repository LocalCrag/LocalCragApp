import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { Textarea } from 'primeng/textarea';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { PageTitleService } from '../../../services/core/page-title.service';
import {
  SuggestionLine,
  SuggestionTopoImage,
  SuggestionsService,
} from '../../../services/crud/suggestions.service';
import { TopoImage } from '../../../models/topo-image';
import { LinePath } from '../../../models/line-path';
import { TopoImageViewerComponent } from '../../shared/components/topo-image/topo-image-viewer.component';

type ReviewTarget =
  | { kind: 'line'; item: SuggestionLine; action: 'publish' | 'reject' }
  | {
      kind: 'topoImage';
      item: SuggestionTopoImage;
      action: 'publish' | 'reject';
    };

interface SuggestionLineView extends SuggestionLine {
  preview: TopoImage | null;
}

interface SuggestionTopoImageView extends SuggestionTopoImage {
  preview: TopoImage;
}

@Component({
  selector: 'lc-suggestion-list',
  imports: [
    TranslocoDirective,
    ButtonModule,
    DialogModule,
    Message,
    FormsModule,
    RouterLink,
    Textarea,
    TopoImageViewerComponent,
  ],
  templateUrl: './suggestion-list.component.html',
  styleUrl: './suggestion-list.component.scss',
})
export class SuggestionListComponent implements OnInit {
  lines: SuggestionLineView[] = [];
  topoImages: SuggestionTopoImageView[] = [];
  dialogVisible = false;
  message = '';
  saving = false;
  private pending: ReviewTarget | null = null;

  private suggestionsService = inject(SuggestionsService);
  private title = inject(Title);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    const pageTitle = this.translocoService.translate(
      marker('suggestions.title'),
    );
    this.pageTitleService.setTitle(pageTitle, { heroDefaultBg: true });
    this.store
      .select(selectInstanceName)
      .pipe(take(1))
      .subscribe((instanceName) => {
        this.title.setTitle(`${pageTitle} - ${instanceName}`);
      });
    this.load();
  }

  load() {
    this.suggestionsService.getQueue().subscribe((queue) => {
      this.lines = queue.lines.map((line) => ({
        ...line,
        preview: this.linePreview(line),
      }));
      this.topoImages = queue.topoImages.map((image) => {
        const preview = TopoImage.deserialize(image);
        preview.linePaths = [];
        preview.tabuAreas = [];
        return { ...image, preview };
      });
    });
  }

  private linePreview(line: SuggestionLine): TopoImage | null {
    const firstPath = line.linePaths?.[0] as
      { topoImage?: unknown } | undefined;
    if (!firstPath?.topoImage) {
      return null;
    }
    const linePath = LinePath.deserialize(firstPath);
    const topoImage = TopoImage.deserialize(firstPath.topoImage);
    topoImage.linePaths = [linePath];
    return topoImage;
  }

  authorName(author: { firstname: string; lastname: string } | null): string {
    if (!author) {
      return '';
    }
    return `${author.firstname} ${author.lastname}`.trim();
  }

  openReview(target: ReviewTarget) {
    this.pending = target;
    this.message = '';
    this.dialogVisible = true;
  }

  confirm() {
    if (!this.pending || this.saving) {
      return;
    }
    const message = this.message.trim() || null;
    const pending = this.pending;
    const request =
      pending.kind === 'line'
        ? pending.action === 'publish'
          ? this.suggestionsService.publishLine(pending.item.slug, message)
          : this.suggestionsService.rejectLine(pending.item.slug, message)
        : pending.action === 'publish'
          ? this.suggestionsService.publishTopoImage(pending.item.id, message)
          : this.suggestionsService.rejectTopoImage(pending.item.id, message);
    this.saving = true;
    request.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.pending = null;
        this.load();
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}
