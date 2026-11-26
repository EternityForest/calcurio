/** One point in a lookup column: a value at an axis coordinate. */
export interface LookupPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Parses a lookup cell such as "100@25; 39@844" or "100@25, 39@844" into
 * points. The value comes first, the axis coordinate second. Returns null
 * when the text is not a valid list of pairs.
 */
export function parseLookupCell(cell: string): LookupPoint[] | null {
  const text = cell.trim();
  if (text === '') {
    return null;
  }
  const parts = text
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (parts.length === 0) {
    return null;
  }
  const points: LookupPoint[] = [];
  for (const part of parts) {
    const at = part.indexOf('@');
    if (at <= 0 || at === part.length - 1) {
      return null;
    }
    const yText = part.slice(0, at).trim();
    const xText = part.slice(at + 1).trim();
    const y = Number(yText);
    const x = Number(xText);
    if (!Number.isFinite(y) || !Number.isFinite(x)) {
      return null;
    }
    points.push({ x, y });
  }
  points.sort((left, right) => left.x - right.x);
  for (let index = 1; index < points.length; index += 1) {
    if (points[index]!.x === points[index - 1]!.x) {
      return null;
    }
  }
  return points;
}

/**
 * Evaluates a lookup at an axis coordinate using monotone cubic (Fritsch-
 * Carlson) interpolation. Outside the sampled range the nearest segment is
 * extended linearly, so the result never overshoots or rings.
 */
export function interpolateAt(
  points: readonly LookupPoint[],
  x: number,
): number | null {
  if (points.length === 0) {
    return null;
  }
  if (points.length === 1) {
    return points[0]!.y;
  }

  const sorted = [...points].sort((left, right) => left.x - right.x);
  const count = sorted.length;
  const steps = new Array<number>(count - 1);
  const slopes = new Array<number>(count - 1);
  for (let index = 0; index < count - 1; index += 1) {
    const left = sorted[index]!;
    const right = sorted[index + 1]!;
    const step = right.x - left.x;
    if (step <= 0) {
      return null;
    }
    steps[index] = step;
    slopes[index] = (right.y - left.y) / step;
  }

  if (x <= sorted[0]!.x) {
    return sorted[0]!.y + slopes[0]! * (x - sorted[0]!.x);
  }
  if (x >= sorted[count - 1]!.x) {
    return (
      sorted[count - 1]!.y + slopes[count - 2]! * (x - sorted[count - 1]!.x)
    );
  }

  const tangents = new Array<number>(count);
  tangents[0] = slopes[0]!;
  tangents[count - 1] = slopes[count - 2]!;
  for (let index = 1; index < count - 1; index += 1) {
    const previous = slopes[index - 1]!;
    const next = slopes[index]!;
    if (previous * next <= 0) {
      tangents[index] = 0;
    } else {
      const weight1 = 2 * steps[index]! + steps[index - 1]!;
      const weight2 = steps[index]! + 2 * steps[index - 1]!;
      tangents[index] =
        (weight1 + weight2) / (weight1 / previous + weight2 / next);
    }
  }

  let segment = 0;
  while (segment < count - 2 && x > sorted[segment + 1]!.x) {
    segment += 1;
  }
  const left = sorted[segment]!;
  const right = sorted[segment + 1]!;
  const t = (x - left.x) / steps[segment]!;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return (
    h00 * left.y +
    h10 * steps[segment]! * tangents[segment]! +
    h01 * right.y +
    h11 * steps[segment]! * tangents[segment + 1]!
  );
}
