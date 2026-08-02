import { Map as MaplibreMap } from 'maplibre-gl';

export type MapImageSpec = { name: string; path: string; size?: number };

/**
 * Load raster/SVG images into a MapLibre map (skips names already registered).
 * Resolves when all images have loaded or rejects on the first failure.
 */
export function loadMapImages(
  map: MaplibreMap,
  images: MapImageSpec[],
): Promise<void> {
  const pending = images.filter((image) => !map.hasImage(image.name));
  if (pending.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(
    pending.map(
      (image) =>
        new Promise<void>((resolve, reject) => {
          const size = image.size ?? 100;
          const img = new Image(size, size);
          img.onload = () => {
            if (!map.hasImage(image.name)) {
              map.addImage(image.name, img);
            }
            resolve();
          };
          img.onerror = () =>
            reject(new Error(`Failed to load map image: ${image.path}`));
          img.src = image.path;
        }),
    ),
  ).then(() => undefined);
}
