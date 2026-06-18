import {
  calculateHeaderSubmenuPosition,
  headerSubmenuPositionsEqual,
  measureSubmenuContentHeight,
} from './position-header-submenu';

describe('calculateHeaderSubmenuPosition', () => {
  const viewport = { viewportWidth: 1200, viewportHeight: 400 };

  it('places first-level dropdown below the anchor', () => {
    const position = calculateHeaderSubmenuPosition({
      anchorRect: { top: 48, bottom: 80, left: 100, right: 180 },
      submenuWidth: 200,
      submenuHeight: 160,
      isFirstChild: true,
      ...viewport,
    });

    expect(position).toEqual({ top: 80, left: 100 });
  });

  it('places nested submenu to the right of the anchor', () => {
    const position = calculateHeaderSubmenuPosition({
      anchorRect: { top: 120, bottom: 152, left: 100, right: 300 },
      submenuWidth: 200,
      submenuHeight: 160,
      isFirstChild: false,
      ...viewport,
    });

    expect(position).toEqual({ top: 120, left: 300 });
  });

  it('shifts first-level dropdown up when it overflows the bottom', () => {
    const position = calculateHeaderSubmenuPosition({
      anchorRect: { top: 48, bottom: 80, left: 100, right: 180 },
      submenuWidth: 200,
      submenuHeight: 360,
      isFirstChild: true,
      ...viewport,
    });

    expect(position.top).toBe(40);
    expect(position.left).toBe(100);
  });

  it('shifts nested submenu up to fit when vertical space is limited', () => {
    const position = calculateHeaderSubmenuPosition({
      anchorRect: { top: 300, bottom: 332, left: 100, right: 300 },
      submenuWidth: 200,
      submenuHeight: 200,
      isFirstChild: false,
      ...viewport,
    });

    expect(position).toEqual({ top: 200, left: 300 });
  });

  it('aligns nested flyouts to the parent panel edge for siblings at the same depth', () => {
    const panelRect = { left: 100, right: 340 };
    const firstItem = calculateHeaderSubmenuPosition({
      anchorRect: { top: 120, bottom: 152, left: 100, right: 280 },
      panelRect,
      submenuWidth: 200,
      submenuHeight: 160,
      isFirstChild: false,
      ...viewport,
    });
    const secondItem = calculateHeaderSubmenuPosition({
      anchorRect: { top: 152, bottom: 184, left: 100, right: 310 },
      panelRect,
      submenuWidth: 200,
      submenuHeight: 160,
      isFirstChild: false,
      ...viewport,
    });

    expect(firstItem.left).toBe(340);
    expect(secondItem.left).toBe(340);
    expect(firstItem.top).toBe(120);
    expect(secondItem.top).toBe(152);
  });

  it('flips submenu to the left when it overflows the right edge', () => {
    const position = calculateHeaderSubmenuPosition({
      anchorRect: { top: 120, bottom: 152, left: 1050, right: 1180 },
      panelRect: { left: 980, right: 1180 },
      submenuWidth: 200,
      submenuHeight: 120,
      isFirstChild: false,
      ...viewport,
    });

    expect(position).toEqual({ top: 120, left: 780 });
  });

  it('clamps submenu to the viewport and makes it scrollable when too tall', () => {
    const position = calculateHeaderSubmenuPosition({
      anchorRect: { top: 20, bottom: 52, left: 100, right: 180 },
      submenuWidth: 200,
      submenuHeight: 500,
      isFirstChild: true,
      viewportWidth: 1200,
      viewportHeight: 300,
    });

    expect(position).toEqual({
      top: 0,
      left: 100,
      maxHeight: 300,
      scrollable: true,
    });
  });

  it('measureSubmenuContentHeight uses scrollHeight without clearing styles', () => {
    const submenu = document.createElement('div');
    submenu.style.setProperty('max-height', '100px', 'important');
    submenu.style.setProperty('overflow-y', 'scroll', 'important');
    Object.defineProperty(submenu, 'scrollHeight', {
      configurable: true,
      get: () => 420,
    });

    expect(measureSubmenuContentHeight(submenu)).toBe(420);
    expect(submenu.style.getPropertyValue('max-height')).toBe('100px');
  });

  it('headerSubmenuPositionsEqual detects unchanged layout', () => {
    const position = { top: 80, left: 100, maxHeight: 300, scrollable: true };
    expect(headerSubmenuPositionsEqual(position, { ...position })).toBe(true);
    expect(
      headerSubmenuPositionsEqual(position, { ...position, top: 81 }),
    ).toBe(false);
  });
});
