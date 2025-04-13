import {
  Directive,
  ElementRef,
  EventEmitter,
  Output,
  OnDestroy,
} from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { throttleTime, debounceTime, map } from 'rxjs/operators';

/**
 * Adds horizontal and vertical swipe detection to an element.
 * The events are throttled to prevent excessive firing.
 */
@Directive({
  selector: '[lcSwiper]',
})
export class SwiperDirective implements OnDestroy {
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private subscriptions: Subscription = new Subscription();

  @Output() swipeHorizontal = new EventEmitter<void>();
  @Output() swipeVertical = new EventEmitter<void>();

  constructor(private el: ElementRef) {
    const touchStart$ = fromEvent<TouchEvent>(
      this.el.nativeElement,
      'touchstart',
    ).pipe(
      map((event) => {
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
      }),
    );

    const touchMove$ = fromEvent<TouchEvent>(
      this.el.nativeElement,
      'touchmove',
    ).pipe(
      throttleTime(100), // Emit at most every 100ms
      map((event) => {
        const deltaX = event.touches[0].clientX - this.touchStartX;
        const deltaY = event.touches[0].clientY - this.touchStartY;
        return { deltaX, deltaY };
      }),
    );

    const touchEnd$ = fromEvent<TouchEvent>(
      this.el.nativeElement,
      'touchend',
    ).pipe(
      debounceTime(100), // Ensure the last event is emitted
    );

    this.subscriptions.add(touchStart$.subscribe());

    this.subscriptions.add(
      touchMove$.subscribe(({ deltaX, deltaY }) => {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          this.swipeHorizontal.emit();
        } else {
          this.swipeVertical.emit();
        }
      }),
    );

    this.subscriptions.add(
      touchEnd$.subscribe(() => {
        // Handle any final logic if needed
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
