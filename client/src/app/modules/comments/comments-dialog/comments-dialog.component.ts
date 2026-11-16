import { Component, OnDestroy } from '@angular/core';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { CommentsComponent } from '../comments/comments.component';
import { LCObject } from '../../../models/object';
import { Ascent } from '../../../models/ascent';
import { AscentDialogSummaryComponent } from '../../ascent/ascent-dialog-summary/ascent-dialog-summary.component';

type CommentsDialogContext = {
  object: LCObject;
  commentCount?: number | null;
  onCountChange?: (count: number) => void;
};

@Component({
  selector: 'lc-comments-dialog',
  imports: [CommentsComponent, AscentDialogSummaryComponent],
  templateUrl: './comments-dialog.component.html',
  styleUrl: './comments-dialog.component.scss',
})
export class CommentsDialogComponent implements OnDestroy {
  private context = injectBrnDialogContext<CommentsDialogContext>();

  public object: LCObject = this.context.object;

  get ascent(): Ascent | null {
    return this.object instanceof Ascent ? this.object : null;
  }
  private latestCount: number | null = this.context.commentCount ?? null;
  private hasReceivedCount = false;

  onCountChange(count: number): void {
    // Skip the initial reset emit(0) from lc-comments before the first page loads.
    if (!this.hasReceivedCount && count === 0 && (this.latestCount ?? 0) > 0) {
      return;
    }
    this.hasReceivedCount = true;
    this.latestCount = count;
    this.context.onCountChange?.(count);
  }

  ngOnDestroy(): void {
    if (this.hasReceivedCount && this.latestCount !== null) {
      this.context.onCountChange?.(this.latestCount);
    }
  }
}
