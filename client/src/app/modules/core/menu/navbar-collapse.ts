/**
 * Thresholds for progressive header control hiding when the top navigation overflows.
 *
 * `MenuComponent.reconcileNavbarOverflow()` resets `navbarCollapseLevel` to 0 on each
 * pass and increases it step by step. An element is visible while
 * `navbarCollapseLevel < NAVBAR_COLLAPSE_LEVELS.<element>`.
 *
 * Example: at level 2, theme toggle and language select are hidden; notifications,
 * search, and logo remain visible.
 *
 * This runs only after the dynamic link menu has already been collapsed into the
 * burger menu (see `HeaderMenuComponent.overflowDetected`). Login, user avatar, and
 * the burger button itself are never hidden by this mechanism.
 */
export const NAVBAR_COLLAPSE_LEVELS = {
  /** Guest-only sun/moon color-scheme toggle. */
  themeToggle: 1,
  /** Guest-only language flag select. */
  languageSelect: 2,
  /** Logged-in notification bell. */
  notifications: 3,
  /** Search fake input (opens search dialog). */
  search: 4,
  /** Logo image or instance name in the menubar start slot. */
  logo: 5,
} as const;

/** Highest collapse level; no further header controls are hidden beyond this. */
export const MAX_NAVBAR_COLLAPSE_LEVEL = NAVBAR_COLLAPSE_LEVELS.logo;
