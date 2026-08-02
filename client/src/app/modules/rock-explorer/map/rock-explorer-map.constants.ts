/** Rock explorer map source / layer ids and domain paint colors. */

export const ROCK_EXPLORER_SOURCES = {
  features: 'rock-explorer-features',
  draft: 'rock-explorer-draft',
  labels: 'rock-explorer-feature-labels',
  imageLocations: 'rock-explorer-image-locations',
  parking: 'rock-explorer-parking',
  paths: 'rock-explorer-paths',
} as const;

export const ROCK_EXPLORER_LAYERS = {
  polygonsFill: 'rock-explorer-polygons-fill',
  polygonsOutline: 'rock-explorer-polygons-outline',
  points: 'rock-explorer-points',
  draftLine: 'rock-explorer-draft-line',
  draftFill: 'rock-explorer-draft-fill',
  draftOutline: 'rock-explorer-draft-outline',
  draftPoints: 'rock-explorer-draft-points',
  selectedPoints: 'rock-explorer-selected-points',
  selectedPolygons: 'rock-explorer-selected-polygons',
  labels: 'rock-explorer-labels',
  imageLocations: 'rock-explorer-image-locations',
  paths: 'rock-explorer-paths',
  pathLabels: 'rock-explorer-path-labels',
  parking: 'rock-explorer-parking',
} as const;

export const POTENTIAL_FILL_COLORS: Record<string, string> = {
  // Blues for known potential; yellow = unexplored; red = none.
  HIGH: '#1d4ed8',
  MEDIUM: '#3b82f6',
  LOW: '#93c5fd',
  NONE: '#dc2626',
  UNEXPLORED: '#eab308',
};

export const POTENTIAL_OUTLINE_COLORS: Record<string, string> = {
  HIGH: '#1e3a8a',
  MEDIUM: '#1d4ed8',
  LOW: '#2563eb',
  NONE: '#b91c1c',
  UNEXPLORED: '#a16207',
};

/** Shared accent for gallery GPS dots and path overlays. */
export const MAP_MEDIA_ACCENT = '#ec4899';

export const PARKING_ICON = {
  name: 'lc-parking',
  path: 'assets/icons/parking.svg',
} as const;
