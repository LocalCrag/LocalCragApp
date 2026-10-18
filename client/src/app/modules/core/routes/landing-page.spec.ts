import { LandingPage } from '../../../enums/landing-page';
import { landingPagePath } from './landing-page';

describe('landingPagePath', () => {
  it('keeps news as the default', () => {
    expect(landingPagePath(LandingPage.NEWS, 0)).toBe('news');
    expect(landingPagePath(null, 0)).toBe('news');
    expect(landingPagePath('UNKNOWN', 0)).toBe('news');
  });

  it('maps the other built-in pages', () => {
    expect(landingPagePath(LandingPage.TOPO, 0)).toBe('topo');
    expect(landingPagePath(LandingPage.ASCENTS, 2)).toBe('topo/ascents');
    expect(landingPagePath(LandingPage.RANKING, 0)).toBe('topo/ranking');
    expect(landingPagePath(LandingPage.HISTORY, 0)).toBe('history');
  });

  it('opens a menu page by slug', () => {
    expect(landingPagePath(LandingPage.MENU_PAGE, 0, 'legal-notice')).toBe(
      'pages/legal-notice',
    );
    expect(landingPagePath(LandingPage.MENU_PAGE, 0, null)).toBe('news');
    expect(landingPagePath(LandingPage.MENU_PAGE, 0, '../admin')).toBe('news');
    expect(landingPagePath(LandingPage.MENU_PAGE, 0, 'pages/other')).toBe(
      'news',
    );
  });

  it('places gallery under the skipped hierarchy prefix', () => {
    expect(landingPagePath(LandingPage.GALLERY, 0)).toBe('topo/gallery');
    expect(landingPagePath(LandingPage.GALLERY, 1)).toBe(
      'topo/_default/gallery',
    );
    expect(landingPagePath(LandingPage.GALLERY, 2)).toBe(
      'topo/_default/_default/gallery',
    );
  });
});
