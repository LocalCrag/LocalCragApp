import {
  DestroyRef,
  ElementRef,
  Signal,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

const HEADER_CHIP_CLASS = 'spot-status-tag--corner';
const MOBILE_QUERY = '(max-width: 1000px)';

/** Header chips are icon-only on a phone, and their label tooltips get in the way. */
export function injectDisableHeaderChipTooltip(): Signal<boolean> {
  const host = inject(ElementRef<HTMLElement>);
  const disabled = signal(false);
  const media = window.matchMedia(MOBILE_QUERY);
  const update = () => {
    disabled.set(
      host.nativeElement.classList.contains(HEADER_CHIP_CLASS) && media.matches,
    );
  };
  update();
  afterNextRender(update);
  media.addEventListener('change', update);
  inject(DestroyRef).onDestroy(() =>
    media.removeEventListener('change', update),
  );
  return disabled.asReadonly();
}
