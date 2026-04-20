import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Reactions } from '../../../models/reactions';
import { Popover } from 'primeng/popover';
import { ReactionsService } from '../../../services/crud/reactions.service';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';
import { User } from '../../../models/user';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReactionsInfoModalComponent } from '../reactions-info-modal/reactions-info-modal.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

@Component({
  selector: 'lc-reaction-wrapper',
  imports: [Popover, HasPermissionDirective],
  templateUrl: './reaction-wrapper.component.html',
  styleUrl: './reaction-wrapper.component.scss',
  providers: [DialogService],
})
export class ReactionWrapperComponent implements OnInit, OnChanges {
  @Input() reactions: Reactions;
  @Input() targetType: string;
  @Input() targetId: string;
  @Input() createdById: string;
  @Output() reactionsChange = new EventEmitter<Reactions>();
  @ViewChild('popover') popover: Popover;
  @ViewChild('reactionBar') reactionBar: ElementRef<HTMLElement>;

  readonly availableReactions = ['💪', '❤️', '👍', '🤯', '🔥', '🎉', '😀'];
  myReaction: string | null = null;
  isPickerOpen = false;

  private currentUser: User | null = null;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressFired = false;
  private cdr = inject(ChangeDetectorRef);
  private reactionsService = inject(ReactionsService);
  private store = inject(Store);
  private dialogService = inject(DialogService);
  private translocoService = inject(TranslocoService);
  private ref: DynamicDialogRef | undefined;

  ngOnInit(): void {
    this.store
      .select(selectCurrentUser)
      .pipe(take(1))
      .subscribe((user) => {
        this.currentUser = user;
        this.syncMyReaction();
      });
  }

  ngOnChanges(): void {
    this.syncMyReaction();
  }

  private syncMyReaction(): void {
    if (!this.reactions || !this.currentUser) {
      this.myReaction = null;
      return;
    }
    const existing = this.reactions.find(
      (r) => r.user.id === this.currentUser.id,
    );
    this.myReaction = existing ? existing.emoji : null;
  }

  get sortedReactions(): { emoji: string; count: number }[] {
    if (!this.reactions) return [];
    const counts = new Map<string, number>();
    for (const r of this.reactions) {
      counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count);
  }

  get isDisabled(): boolean {
    return (
      !!this.currentUser &&
      !!this.createdById &&
      this.currentUser.id === this.createdById
    );
  }

  get canOpenPicker(): boolean {
    return !!this.currentUser && !this.isDisabled;
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  get totalReactions(): number {
    return this.reactions?.length ?? 0;
  }

  openPicker(event: MouseEvent): void {
    if (this.longPressFired) {
      this.longPressFired = false;
      return;
    }
    if (!this.currentUser) {
      if (this.totalReactions > 0) {
        this.openInfoModal(event);
      }
      return;
    }
    if (!this.canOpenPicker || !this.popover) {
      if (this.totalReactions > 0) {
        this.openInfoModal(event);
      }
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
      if (this.totalReactions > 0) {
        this.openInfoModal();
      } else if (this.canOpenPicker && this.popover) {
        const fakeEvent = { stopPropagation: () => {} };
        this.popover.toggle(fakeEvent as any, this.reactionBar.nativeElement);
      }
    }, 500);
  }

  onTouchEnd(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  openInfoModal(event?: MouseEvent): void {
    event?.stopPropagation();
    this.ref = this.dialogService.open(ReactionsInfoModalComponent, {
      modal: true,
      closable: true,
      draggable: false,
      dismissableMask: true,
      focusOnShow: false,
      header: this.translocoService.translate(
        marker('reactions.infoModalTitle'),
      ),
      data: {
        reactions: this.reactions,
      },
    });
  }

  selectReaction(emoji: string): void {
    if (this.myReaction === emoji) {
      this.reactionsService
        .deleteReaction(this.targetType, this.targetId)
        .subscribe((reactions) => {
          this.reactionsChange.emit(reactions);
        });
    } else {
      const request$ = this.myReaction
        ? this.reactionsService.updateReaction(
            this.targetType,
            this.targetId,
            emoji,
          )
        : this.reactionsService.createReaction(
            this.targetType,
            this.targetId,
            emoji,
          );
      request$.subscribe((reactions) => {
        this.reactionsChange.emit(reactions);
      });
    }
    this.popover.hide();
  }
}
