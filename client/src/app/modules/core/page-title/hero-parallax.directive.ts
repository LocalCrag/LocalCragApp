import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  OnInit,
} from '@angular/core';

/** Subtle scroll parallax for page-title hero backgrounds. */
@Directive({
  selector: '[lcHeroParallax]',
})
export class HeroParallaxDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private rafId = 0;

  ngOnInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const update = (): void => {
      const offset = window.scrollY * 0.35;
      this.el.nativeElement.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const onScroll = (): void => {
      cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(this.rafId);
      this.el.nativeElement.style.transform = '';
    });
  }
}
