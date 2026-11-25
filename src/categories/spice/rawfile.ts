/**
 * Parser for the rawfile ngspice writes with `-r` in batch mode. Only the
 * plain binary `real` format is supported: a short ASCII header, the literal
 * `Binary:` marker, then little-endian float64 samples in point-major order.
 */

const BINARY_MARKER = 'Binary:\n';
const MARKER_BYTES = new TextEncoder().encode(BINARY_MARKER);
const BYTES_PER_SAMPLE = 8;

/** Raised when a rawfile is not a supported binary transient result. */
export class RawFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RawFileError';
  }
}

/** One parsed simulation result. */
export interface RawFile {
  /** Vector names, lowercased exactly as ngspice writes them. */
  readonly names: readonly string[];
  /** Number of samples in every vector. */
  readonly pointCount: number;
  /** One vector per name, each `pointCount` samples long. */
  readonly series: readonly Float64Array[];
}

/**
 * Reads a binary rawfile into named, aligned vectors. Values are copied out, so
 * the returned vectors do not share memory with `bytes`.
 */
export function parseRawFile(bytes: Uint8Array): RawFile {
  const markerIndex = indexOfBytes(bytes, MARKER_BYTES);
  if (markerIndex < 0) {
    throw new RawFileError('The simulation result has no binary data section.');
  }

  const header = new TextDecoder('latin1').decode(
    bytes.subarray(0, markerIndex),
  );

  const flags = readField(header, 'Flags');
  if (flags !== 'real') {
    throw new RawFileError(
      `Unsupported rawfile flags "${flags ?? ''}"; only real plots can be read.`,
    );
  }

  const variableCount = readCount(header, 'No. Variables');
  const pointCount = readCount(header, 'No. Points');
  const names = readNames(header);
  if (names.length !== variableCount) {
    throw new RawFileError(
      `The rawfile lists ${variableCount} variables but names ${names.length}.`,
    );
  }

  const dataStart = markerIndex + MARKER_BYTES.length;
  const dataLength = variableCount * pointCount * BYTES_PER_SAMPLE;
  if (bytes.length - dataStart < dataLength) {
    throw new RawFileError(
      'The simulation result is shorter than its header claims.',
    );
  }

  const view = new DataView(
    bytes.buffer,
    bytes.byteOffset + dataStart,
    dataLength,
  );
  const series: Float64Array[] = [];
  for (let variable = 0; variable < variableCount; variable += 1) {
    const values = new Float64Array(pointCount);
    for (let point = 0; point < pointCount; point += 1) {
      const offset = (point * variableCount + variable) * BYTES_PER_SAMPLE;
      values[point] = view.getFloat64(offset, true);
    }
    series.push(values);
  }

  return { names, pointCount, series };
}

/** Returns the vector named `name`, or undefined when it is absent. */
export function findVector(
  file: RawFile,
  name: string,
): Float64Array | undefined {
  const index = file.names.indexOf(name);
  return index < 0 ? undefined : file.series[index];
}

/** Finds the first occurrence of `needle` in `bytes`, or -1. */
function indexOfBytes(bytes: Uint8Array, needle: Uint8Array): number {
  const limit = bytes.length - needle.length;
  for (let start = 0; start <= limit; start += 1) {
    let matched = true;
    for (let index = 0; index < needle.length; index += 1) {
      if (bytes[start + index] !== needle[index]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return start;
    }
  }
  return -1;
}

/** Reads a `Field: value` line from the header, trimmed, or null. */
function readField(header: string, field: string): string | null {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^${escaped}:[ \\t]*(.*)$`, 'm').exec(header);
  const value = match?.[1]?.trim();
  return value === undefined || value === '' ? null : value;
}

/** Reads a positive integer header field, such as the variable count. */
function readCount(header: string, field: string): number {
  const text = readField(header, field);
  const value = text === null ? Number.NaN : Number(text);
  if (!Number.isInteger(value) || value <= 0) {
    throw new RawFileError(
      `The rawfile field "${field}" is missing or invalid.`,
    );
  }
  return value;
}

/** Reads the variable names from the header's `Variables:` block. */
function readNames(header: string): string[] {
  const block = /(?:^|\n)Variables:[ \t]*\r?\n([\s\S]*)$/.exec(header);
  if (block === null) {
    throw new RawFileError('The rawfile has no variable list.');
  }
  const names: string[] = [];
  for (const line of (block[1] ?? '').split('\n')) {
    const entry = /^\s*\d+\s+(\S+)/.exec(line);
    if (entry?.[1] !== undefined) {
      names.push(entry[1].toLowerCase());
    }
  }
  return names;
}
