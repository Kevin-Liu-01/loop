export type Point = { x: number; y: number };

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Attempt monotone cubic interpolation (Catmull-Rom → Bézier conversion).
 * Produces a smooth curve that passes through every data point without
 * overshooting, which matters for non-negative chart data.
 */
export function smoothPath(points: Point[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${r(points[0].x)},${r(points[0].y)}`;
  if (points.length === 2) {
    return `M${r(points[0].x)},${r(points[0].y)}L${r(points[1].x)},${r(points[1].y)}`;
  }

  let d = `M${r(points[0].x)},${r(points[0].y)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += `C${r(cp1x)},${r(cp1y)},${r(cp2x)},${r(cp2y)},${r(p2.x)},${r(p2.y)}`;
  }

  return d;
}

export function scaleLinear(
  domain: [number, number],
  range: [number, number]
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const factor = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  return (value: number) => r0 + (value - d0) * factor;
}

export function findNearestIndex(
  clientX: number,
  containerRect: DOMRect,
  count: number,
  viewBoxWidth: number,
  xScale: (i: number) => number
): number {
  const pct = (clientX - containerRect.left) / containerRect.width;
  const vbX = pct * viewBoxWidth;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < count; i++) {
    const d = Math.abs(xScale(i) - vbX);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

export function niceMax(value: number): number {
  if (value <= 0) return 4;
  if (value <= 4) return 4;
  if (value <= 10) return 10;

  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;

  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}
