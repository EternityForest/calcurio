/**
 * One sample in a lookup cell: a value at one or more axis coordinates. A
 * one-dimensional sample has a single coordinate; a two-dimensional one has
 * two, matching the order the column's composite unit lists its axes.
 */
export interface LookupPoint {
  readonly coords: readonly number[];
  readonly y: number;
}

/**
 * A parsed lookup cell. `points` are the sampled values, each carrying its own
 * axis coordinates; `fallback` is a plain value written without any "@" (or
 * the value of a numeric cell), used when there is nothing to interpolate. A
 * point may leave trailing coordinates out, in which case the standard value
 * for that axis is assumed.
 */
export interface LookupCell {
  readonly points: readonly LookupPoint[];
  readonly fallback: number | null;
}

/**
 * Parses a lookup cell into a `LookupCell`. Cells may hold one-dimensional
 * samples such as "100@25; 39@844", two-dimensional samples such as
 * "50@59,89; 60@60,90", or a plain number used as a fallback. Legacy
 * comma-separated one-dimensional lists ("100@25, 39@844") are still accepted.
 * Returns null when the text is not a valid cell.
 */
export function parseLookupCell(cell: string): LookupCell | null {
  const text = cell.trim();
  if (text === '') {
    return null;
  }

  const points: LookupPoint[] = [];
  let fallback: number | null = null;
  let hasFallback = false;

  for (const entry of splitEntries(text)) {
    const at = entry.indexOf('@');
    if (at === -1) {
      const value = Number(entry);
      if (!Number.isFinite(value) || hasFallback) {
        return null;
      }
      fallback = value;
      hasFallback = true;
      continue;
    }
    if (at === 0 || at === entry.length - 1) {
      return null;
    }
    const y = Number(entry.slice(0, at).trim());
    if (!Number.isFinite(y)) {
      return null;
    }
    const coords: number[] = [];
    for (const part of entry.slice(at + 1).split(',')) {
      const coord = Number(part.trim());
      if (!Number.isFinite(coord)) {
        return null;
      }
      coords.push(coord);
    }
    if (coords.length === 0) {
      return null;
    }
    points.push({ coords, y });
  }

  if (points.length === 0 && !hasFallback) {
    return null;
  }
  points.sort(comparePoints);
  for (let index = 1; index < points.length; index += 1) {
    if (sameCoords(points[index]!.coords, points[index - 1]!.coords)) {
      return null;
    }
  }
  return { points, fallback };
}

/**
 * Normalizes a stored table cell to a `LookupCell`. A finite number becomes a
 * fallback-only cell (the transparent upgrade of a plain numeric column to a
 * lookup); a string is parsed; anything else yields null.
 */
export function lookupCellOf(cell: unknown): LookupCell | null {
  if (typeof cell === 'number') {
    return Number.isFinite(cell) ? { points: [], fallback: cell } : null;
  }
  if (typeof cell === 'string') {
    return parseLookupCell(cell);
  }
  return null;
}

/** Splits a cell into entries, honouring the legacy comma-separated form. */
function splitEntries(text: string): string[] {
  if (text.includes(';')) {
    return splitAndTrim(text, ';');
  }
  // A legacy one-dimensional list separates samples with commas. Only treat
  // commas as separators when more than one "@" is present, so a two-
  // dimensional point such as "50@59,89" keeps its coordinates together.
  if ((text.match(/@/g)?.length ?? 0) > 1) {
    return splitAndTrim(text, ',');
  }
  return [text];
}

function splitAndTrim(text: string, separator: string): string[] {
  return text
    .split(separator)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

function comparePoints(left: LookupPoint, right: LookupPoint): number {
  const length = Math.min(left.coords.length, right.coords.length);
  for (let index = 0; index < length; index += 1) {
    const delta = left.coords[index]! - right.coords[index]!;
    if (delta !== 0) {
      return delta;
    }
  }
  return left.coords.length - right.coords.length;
}

function sameCoords(
  left: readonly number[],
  right: readonly number[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

/**
 * Evaluates one-dimensional samples at a coordinate using monotone cubic
 * (Fritsch-Carlson) interpolation. Outside the sampled range the nearest
 * segment is extended linearly, so the result never overshoots or rings.
 * Coordinates beyond the first are ignored, so this also reads the first axis
 * of a two-dimensional point set.
 */
export function interpolateAt(
  points: readonly LookupPoint[],
  x: number,
): number | null {
  const samples: { x: number; y: number }[] = [];
  for (const point of points) {
    const axis = point.coords[0];
    if (typeof axis === 'number' && Number.isFinite(axis)) {
      samples.push({ x: axis, y: point.y });
    }
  }
  if (samples.length === 0) {
    return null;
  }
  if (samples.length === 1) {
    return samples[0]!.y;
  }

  const sorted = [...samples].sort((left, right) => left.x - right.x);
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

/**
 * Evaluates a lookup cell at a query point. `coords` and `standards` are given
 * one entry per axis: a coordinate of null falls back to the standard, and a
 * point that leaves a coordinate out also assumes the standard. A cell with no
 * samples returns its fallback. One axis uses monotone cubic interpolation;
 * two use bilinear interpolation over the sampled grid.
 */
export function interpolateLookup(
  cell: LookupCell,
  coords: readonly (number | null)[],
  standards: readonly (number | null)[],
): number | null {
  if (cell.points.length === 0) {
    return cell.fallback;
  }

  let dimension = Math.max(coords.length, standards.length);
  for (const point of cell.points) {
    dimension = Math.max(dimension, point.coords.length);
  }
  if (dimension === 0) {
    return cell.fallback;
  }

  const query: number[] = [];
  for (let index = 0; index < dimension; index += 1) {
    const value = coords[index] ?? standards[index] ?? null;
    if (value === null) {
      return cell.fallback;
    }
    query.push(value);
  }

  const samples: LookupPoint[] = [];
  for (const point of cell.points) {
    const resolved: number[] = [];
    let complete = true;
    for (let index = 0; index < dimension; index += 1) {
      const value = point.coords[index] ?? standards[index] ?? null;
      if (value === null) {
        complete = false;
        break;
      }
      resolved.push(value);
    }
    if (complete) {
      samples.push({ coords: resolved, y: point.y });
    }
  }
  if (samples.length === 0) {
    return cell.fallback;
  }

  if (dimension === 1) {
    return interpolateAt(samples, query[0]!);
  }
  if (dimension === 2) {
    return interpolateSurface(samples, query[0]!, query[1]!);
  }
  return cell.fallback;
}

/**
 * Bilinear interpolation over two-dimensional samples on a rectilinear grid.
 * A single row or column degenerates to one-dimensional interpolation; a
 * missing grid corner falls back to the nearest sample. Query points outside
 * the grid extend the nearest cell linearly.
 */
function interpolateSurface(
  points: readonly LookupPoint[],
  qx: number,
  qy: number,
): number | null {
  const xs = uniqueSorted(points.map((point) => point.coords[0]!));
  const ys = uniqueSorted(points.map((point) => point.coords[1]!));
  if (xs.length === 0 || ys.length === 0) {
    return null;
  }

  const byCell = new Map<string, number>();
  for (const point of points) {
    byCell.set(cellKey(point.coords[0]!, point.coords[1]!), point.y);
  }
  const valueAt = (x: number, y: number): number | null =>
    byCell.get(cellKey(x, y)) ?? null;
  const nearest = (x: number, y: number): number | null => {
    let best: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const point of points) {
      const dx = point.coords[0]! - x;
      const dy = point.coords[1]! - y;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = point.y;
      }
    }
    return best;
  };

  if (xs.length === 1) {
    const samples = ys.map((y) => ({
      coords: [y],
      y: valueAt(xs[0]!, y) ?? nearest(xs[0]!, y) ?? 0,
    }));
    return interpolateAt(samples, qy);
  }
  if (ys.length === 1) {
    const samples = xs.map((x) => ({
      coords: [x],
      y: valueAt(x, ys[0]!) ?? nearest(x, ys[0]!) ?? 0,
    }));
    return interpolateAt(samples, qx);
  }

  const [x0, x1] = bracket(xs, qx);
  const [y0, y1] = bracket(ys, qy);
  const f00 = valueAt(x0, y0) ?? nearest(x0, y0);
  const f01 = valueAt(x0, y1) ?? nearest(x0, y1);
  const f10 = valueAt(x1, y0) ?? nearest(x1, y0);
  const f11 = valueAt(x1, y1) ?? nearest(x1, y1);
  if (f00 === null || f01 === null || f10 === null || f11 === null) {
    return null;
  }

  const tx = x1 === x0 ? 0 : (qx - x0) / (x1 - x0);
  const ty = y1 === y0 ? 0 : (qy - y0) / (y1 - y0);
  return (
    f00 * (1 - tx) * (1 - ty) +
    f01 * (1 - tx) * ty +
    f10 * tx * (1 - ty) +
    f11 * tx * ty
  );
}

/** Nearest bracketing pair in a sorted list, extending at either end. */
function bracket(sorted: readonly number[], value: number): [number, number] {
  if (value <= sorted[0]!) {
    return [sorted[0]!, sorted[1] ?? sorted[0]!];
  }
  const last = sorted.length - 1;
  if (value >= sorted[last]!) {
    return [sorted[last - 1] ?? sorted[last]!, sorted[last]!];
  }
  let index = 0;
  while (index < last && value > sorted[index + 1]!) {
    index += 1;
  }
  return [sorted[index]!, sorted[index + 1]!];
}

function uniqueSorted(values: readonly number[]): number[] {
  const unique = [...new Set(values)];
  unique.sort((left, right) => left - right);
  return unique;
}

function cellKey(x: number, y: number): string {
  return `${x}\u0000${y}`;
}
