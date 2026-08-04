import { Feature, Geometry } from 'geojson';
import { Map as MaplibreMap, Popup } from 'maplibre-gl';

/**
 * Escape user/API strings before interpolating into MapLibre `Popup.setHTML`.
 * That API injects the string as real DOM HTML (not text), so untrusted values
 * like gallery `description` or `thumbnailUrl` must be escaped: otherwise `<`,
 * `>`, `"` can break markup or enable XSS (e.g. `</div><script>…</script>`).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type RockExplorerImageHoverShowOptions = {
  /** Keep the popup open after the pointer leaves the map marker. */
  pin?: boolean;
  /** Cluster size badge; shown when greater than 1. */
  count?: number;
  /** Stable key override (e.g. `cluster:{id}`); defaults to galleryImageId:coords. */
  featureKey?: string;
};

/** Thumbnail hover/pin popup for gallery GPS dots on the rock-explorer map. */
export class RockExplorerImageHoverPopup {
  private static readonly HIDE_DELAY_MS = 1000;

  private popup: Popup | null = null;
  private featureKey: string | null = null;
  private galleryImageId: string | null = null;
  private pinned = false;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private onImageClick: ((galleryImageId: string) => void) | null = null;

  setOnImageClick(handler: ((galleryImageId: string) => void) | null): void {
    this.onImageClick = handler;
  }

  get isPinned(): boolean {
    return this.pinned;
  }

  show(
    map: MaplibreMap,
    feature: Feature<Geometry>,
    coordinates: [number, number],
    options?: RockExplorerImageHoverShowOptions,
  ): void {
    this.clearHideTimer();
    const featureKey =
      options?.featureKey ??
      `${feature.properties?.['galleryImageId'] ?? ''}:${coordinates.join(',')}`;
    const pin = options?.pin === true;

    // While pinned, ignore hover updates for other markers.
    if (this.pinned && !pin && featureKey !== this.featureKey) {
      return;
    }

    if (featureKey === this.featureKey && this.popup) {
      if (pin) {
        this.pinned = true;
      }
      map.getCanvas().style.cursor = 'pointer';
      return;
    }

    this.featureKey = featureKey;
    this.pinned = pin;
    map.getCanvas().style.cursor = 'pointer';

    const galleryImageId = String(feature.properties?.['galleryImageId'] ?? '');
    const thumbnailUrl = String(feature.properties?.['thumbnailUrl'] ?? '');
    const description = String(feature.properties?.['description'] ?? '');
    this.galleryImageId = galleryImageId || null;
    if (!thumbnailUrl) {
      this.hide({ force: true });
      return;
    }

    const count =
      typeof options?.count === 'number' && options.count > 1
        ? options.count
        : null;
    const badgeHtml =
      count != null
        ? `<span class="rock-explorer-image-hover-popup__badge">${String(count)}</span>`
        : '';
    const descriptionHtml = description
      ? `<div class="rock-explorer-image-hover-popup__caption">${escapeHtml(description)}</div>`
      : '';
    const html = `<div class="rock-explorer-image-hover-popup__content"><button type="button" class="rock-explorer-image-hover-popup__image-btn" aria-label="Open image"><img src="${escapeHtml(thumbnailUrl)}" alt="" />${badgeHtml}</button>${descriptionHtml}</div>`;

    if (!this.popup) {
      this.popup = new Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        maxWidth: '200px',
        className: 'rock-explorer-image-hover-popup',
      });
    }
    this.popup.setLngLat(coordinates).setHTML(html).addTo(map);
    this.bindImageClick();
  }

  hide(options?: { force?: boolean }): void {
    if (this.pinned && !options?.force) {
      return;
    }
    if (options?.force) {
      this.clearHideTimer();
      this.removePopup();
      return;
    }
    if (this.hideTimer != null) {
      return;
    }
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      if (this.pinned) {
        return;
      }
      this.removePopup();
    }, RockExplorerImageHoverPopup.HIDE_DELAY_MS);
  }

  private removePopup(): void {
    this.pinned = false;
    this.featureKey = null;
    this.galleryImageId = null;
    this.popup?.remove();
  }

  private clearHideTimer(): void {
    if (this.hideTimer == null) {
      return;
    }
    clearTimeout(this.hideTimer);
    this.hideTimer = null;
  }

  private bindImageClick(): void {
    const root = this.popup?.getElement();
    const button = root?.querySelector(
      '.rock-explorer-image-hover-popup__image-btn',
    );
    if (!(button instanceof HTMLElement)) {
      return;
    }
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const id = this.galleryImageId;
      if (!id) {
        return;
      }
      this.onImageClick?.(id);
    });
  }
}
