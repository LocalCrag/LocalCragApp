import { environment } from '../../../../environments/environment';
import { LandingPage } from '../../../enums/landing-page';

const MENU_PAGE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Internal path for the configured landing page.
 * Unknown values fall back to news, which is the historical default.
 */
export function landingPagePath(
  landingPage: LandingPage | string | null | undefined,
  skippedHierarchyLayers: number,
  landingPageSlug?: string | null,
): string {
  switch (landingPage) {
    case LandingPage.TOPO:
      return 'topo';
    case LandingPage.ASCENTS:
      return 'topo/ascents';
    case LandingPage.RANKING:
      return 'topo/ranking';
    case LandingPage.HISTORY:
      return 'history';
    case LandingPage.MENU_PAGE:
      return landingPageSlug && MENU_PAGE_SLUG.test(landingPageSlug)
        ? `pages/${landingPageSlug}`
        : 'news';
    case LandingPage.GALLERY: {
      const skipped = Math.max(0, skippedHierarchyLayers);
      const prefix = Array.from(
        { length: skipped },
        () => environment.skippedSlug,
      ).join('/');
      return prefix ? `topo/${prefix}/gallery` : 'topo/gallery';
    }
    default:
      return 'news';
  }
}
