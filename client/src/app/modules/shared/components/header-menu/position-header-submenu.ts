/**
 * Viewport-fixed layout for open desktop header submenus.
 *
 * Applies `position: fixed` with calculated coordinates when a submenu is shown.
 * SCSS still declares `position: absolute` for closed panels; inline styles from
 * `applyHeaderSubmenuPosition` take over for active menus. `HeaderMenuService`
 * decides when to position and reset.
 */

/** Inputs for one submenu layout pass (all coordinates are viewport-relative). */
export interface SubmenuPositionInput {
  /** Hovered `.item` row: vertical alignment and first-level horizontal origin. */
  anchorRect: Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>;
  /** Parent menu panel; horizontal flyout alignment so siblings share the same x. */
  panelRect?: Pick<DOMRect, 'left' | 'right'>;
  submenuWidth: number;
  /** Full content height; use `measureSubmenuContentHeight`, not `offsetHeight`. */
  submenuHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  /** True for dropdowns directly under the root menu bar. */
  isFirstChild: boolean;
}

/** Viewport-fixed coordinates and optional scroll clamping for one submenu. */
export interface SubmenuPosition {
  top: number;
  left: number;
  maxHeight?: number;
  /** When true, `overflow-y: scroll` is used so the scrollbar does not flicker. */
  scrollable?: boolean;
}

const POSITION_STYLE_PROPERTIES = [
  'position',
  'top',
  'left',
  'height',
  'max-height',
  'overflow-y',
  'overflow-x',
] as const;

/**
 * Calculates viewport-fixed `top` / `left` for a header submenu.
 *
 * - First-level dropdown: below the anchor (`top = bottom`, `left = left`).
 * - Nested flyout: aligned to the anchor row vertically, parent panel right edge horizontally.
 * - Flips to the left of the panel when the flyout would overflow the viewport right edge.
 * - Shifts up or clamps height when content exceeds available vertical space.
 */
export const calculateHeaderSubmenuPosition = (
  input: SubmenuPositionInput,
): SubmenuPosition => {
  const {
    anchorRect,
    panelRect,
    submenuWidth,
    submenuHeight,
    viewportWidth,
    viewportHeight,
    isFirstChild,
  } = input;

  const horizontalRect = panelRect ?? anchorRect;

  let top = isFirstChild ? anchorRect.bottom : anchorRect.top;
  let left = isFirstChild ? anchorRect.left : horizontalRect.right;

  if (left + submenuWidth > viewportWidth) {
    left = horizontalRect.left - submenuWidth;
  }
  if (left < 0) {
    left = 0;
  }

  if (top + submenuHeight > viewportHeight) {
    if (isFirstChild) {
      top = Math.max(0, top - (top + submenuHeight - viewportHeight));
    } else {
      top = Math.max(0, viewportHeight - submenuHeight);
    }
  }

  const availableHeight = viewportHeight - top;
  if (submenuHeight > availableHeight) {
    return {
      top,
      left,
      maxHeight: availableHeight,
      scrollable: true,
    };
  }

  return { top, left };
};

/**
 * Returns the full scrollable content height of a submenu.
 * Prefer this over `offsetHeight`, which reflects the clamped box when `max-height` is set.
 */
export const measureSubmenuContentHeight = (
  submenuElement: HTMLElement,
): number => submenuElement.scrollHeight;

/** True when a reposition would not change layout (avoids resetting scroll position). */
export const headerSubmenuPositionsEqual = (
  a?: SubmenuPosition,
  b?: SubmenuPosition,
): boolean => {
  if (!a || !b) {
    return false;
  }

  return (
    a.top === b.top &&
    a.left === b.left &&
    a.maxHeight === b.maxHeight &&
    !!a.scrollable === !!b.scrollable
  );
};

/**
 * Applies a calculated position as inline styles on a submenu element.
 * Restores `scrollTop` after writing styles so sibling hovers do not jump the list.
 */
export const applyHeaderSubmenuPosition = (
  submenuElement: HTMLElement,
  position: SubmenuPosition,
): void => {
  const scrollTop = submenuElement.scrollTop;

  submenuElement.style.setProperty('position', 'fixed', 'important');
  submenuElement.style.setProperty('top', `${position.top}px`, 'important');
  submenuElement.style.setProperty('left', `${position.left}px`, 'important');
  submenuElement.style.removeProperty('height');

  if (position.maxHeight !== undefined) {
    submenuElement.style.setProperty(
      'max-height',
      `${position.maxHeight}px`,
      'important',
    );
    submenuElement.style.setProperty(
      'overflow-y',
      position.scrollable ? 'scroll' : 'auto',
      'important',
    );
    submenuElement.style.setProperty('overflow-x', 'hidden', 'important');
  } else {
    submenuElement.style.removeProperty('max-height');
    submenuElement.style.removeProperty('overflow-y');
    submenuElement.style.removeProperty('overflow-x');
  }

  submenuElement.scrollTop = scrollTop;
};

/** Removes all inline positioning styles applied by `applyHeaderSubmenuPosition`. */
export const resetHeaderSubmenuPosition = (
  submenuElement: HTMLElement,
): void => {
  for (const property of POSITION_STYLE_PROPERTIES) {
    submenuElement.style.removeProperty(property);
  }
};
