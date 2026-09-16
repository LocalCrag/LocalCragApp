/** True if the closed ring from `vertices` has crossing (non-adjacent) edges. */
export function polygonRingSelfIntersects(vertices: number[][]): boolean {
  const n = vertices.length;
  // A triangle cannot self-intersect; bowties need ≥4 vertices.
  if (n < 4) {
    return false;
  }
  for (let i = 0; i < n; i++) {
    const a1 = vertices[i];
    const a2 = vertices[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      // Adjacent edges share a vertex — not a self-intersection.
      if (j === i + 1) {
        continue;
      }
      if (i === 0 && j === n - 1) {
        continue;
      }
      const b1 = vertices[j];
      const b2 = vertices[(j + 1) % n];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Cross-product orientation of triangle abc.
 * @returns 1 if abc is counterclockwise, -1 if clockwise, 0 if collinear.
 */
function orient(a: number[], b: number[], c: number[]): number {
  const value = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (Math.abs(value) < 1e-12) {
    return 0;
  }
  return value > 0 ? 1 : -1;
}

/**
 * True if point p lies inside the axis-aligned bounding box of segment ab.
 * Call only after `orient` has shown a, b, and p are collinear.
 */
function onSegment(a: number[], b: number[], p: number[]): boolean {
  return (
    p[0] <= Math.max(a[0], b[0]) + 1e-12 &&
    p[0] >= Math.min(a[0], b[0]) - 1e-12 &&
    p[1] <= Math.max(a[1], b[1]) + 1e-12 &&
    p[1] >= Math.min(a[1], b[1]) - 1e-12
  );
}

/** Proper intersection or collinear overlap of segments ab and cd. */
function segmentsIntersect(
  a: number[],
  b: number[],
  c: number[],
  d: number[],
): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) {
    return true;
  }
  if (o1 === 0 && onSegment(a, b, c)) {
    return true;
  }
  if (o2 === 0 && onSegment(a, b, d)) {
    return true;
  }
  if (o3 === 0 && onSegment(c, d, a)) {
    return true;
  }
  if (o4 === 0 && onSegment(c, d, b)) {
    return true;
  }
  return false;
}
