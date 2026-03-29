import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  ViewChild,
} from '@angular/core';
import { Reactions } from '../../../models/reactions';
import { Popover } from 'primeng/popover';

@Component({
  selector: 'lc-reaction-wrapper',
  imports: [Popover],
  templateUrl: './reaction-wrapper.component.html',
  styleUrl: './reaction-wrapper.component.scss',
})
export class ReactionWrapperComponent {
  @Input() reactions: Reactions;
  @ViewChild('popover') popover: Popover;
  @ViewChild('reactionBar') reactionBar: ElementRef<HTMLElement>;

  readonly availableReactions = ['💪', '❤️', '👍', '🤯', '🔥', '🎉'];
  myReaction: string | null = null;
  isPickerOpen = false;

  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressFired = false;
  private cdr = inject(ChangeDetectorRef);

  get sortedReactions(): { emoji: string; count: number }[] {
    if (!this.reactions) return [];
    return Object.entries(this.reactions)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }

  get totalReactions(): number {
    if (!this.reactions) return 0;
    return Object.values(this.reactions).reduce((sum, c) => sum + c, 0);
  }

  openPicker(event: MouseEvent): void {
    if (this.longPressFired) {
      this.longPressFired = false;
      return;
    }
    this.popover.toggle(event, this.reactionBar.nativeElement);
  }

  onPickerShow(): void {
    this.isPickerOpen = true;
  }

  onPickerHide(): void {
    this.isPickerOpen = false;
    this.cdr.markForCheck();
  }

  onTouchStart(): void {
    this.longPressFired = false;
    this.longPressTimer = setTimeout(() => {
      this.longPressFired = true;
      // toggle calls stopPropagation, so we need to provide a mock function for it not to fail
      const fakeEvent = {
        stopPropagation: () => {},
      };
      this.popover.toggle(fakeEvent as any, this.reactionBar.nativeElement);
    }, 500);
  }

  onTouchEnd(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  selectReaction(emoji: string): void {
    if (this.myReaction === emoji) {
      // TODO: DELETE /api/reactions/{id}
      this.myReaction = null;
    } else {
      // TODO: POST /api/reactions { emoji }
      this.myReaction = emoji;
    }
    this.popover.hide();
  }
}
