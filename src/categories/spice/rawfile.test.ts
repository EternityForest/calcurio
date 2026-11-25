import { describe, expect, it } from 'vitest';
import { RawFileError, findVector, parseRawFile } from './rawfile.js';

interface BuildOptions {
  readonly flags?: string;
  readonly declaredVariables?: number;
  readonly declaredPoints?: number;
}

/**
 * Assembles the binary layout ngspice writes: an ASCII header, the `Binary:`
 * marker, then little-endian float64 samples in point-major order.
 */
function buildRawFile(
  names: readonly string[],
  samples: readonly (readonly number[])[],
  options: BuildOptions = {},
): Uint8Array {
  const header = `${[
    'Title: test',
    'Date: today',
    `Flags: ${options.flags ?? 'real'}`,
    `No. Variables: ${options.declaredVariables ?? names.length}`,
    `No. Points: ${options.declaredPoints ?? samples.length}`,
    'Variables:',
    ...names.map((name, index) => `\t${index}\t${name}\tunknown`),
    'Binary:',
    '',
  ].join('\n')}`;

  const headerBytes = new TextEncoder().encode(header);
  const dataBytes = new Uint8Array(samples.length * names.length * 8);
  const view = new DataView(dataBytes.buffer);
  samples.forEach((point, pointIndex) => {
    point.forEach((value, variableIndex) => {
      const offset = (pointIndex * names.length + variableIndex) * 8;
      view.setFloat64(offset, value, true);
    });
  });

  const bytes = new Uint8Array(headerBytes.length + dataBytes.length);
  bytes.set(headerBytes);
  bytes.set(dataBytes, headerBytes.length);
  return bytes;
}

describe('parseRawFile', () => {
  it('reads vectors and lowercases their names', () => {
    const bytes = buildRawFile(
      ['Time', 'V(3)', 'I(L1)'],
      [
        [0, 0, 0],
        [1e-3, 12, 2.5],
        [2e-3, 9, -1.5],
      ],
    );

    const file = parseRawFile(bytes);

    expect(file.names).toEqual(['time', 'v(3)', 'i(l1)']);
    expect(file.pointCount).toBe(3);
    expect(Array.from(file.series[0]!)).toEqual([0, 1e-3, 2e-3]);
    expect(Array.from(file.series[1]!)).toEqual([0, 12, 9]);
    expect(Array.from(file.series[2]!)).toEqual([0, 2.5, -1.5]);
  });

  it('finds a vector by name', () => {
    const file = parseRawFile(
      buildRawFile(
        ['time', 'v(3)'],
        [
          [0, 1],
          [1, 2],
        ],
      ),
    );

    expect(findVector(file, 'v(3)')).toBe(file.series[1]);
    expect(findVector(file, 'v(9)')).toBeUndefined();
  });

  it('rejects a header without a binary section', () => {
    const bytes = new TextEncoder().encode('Title: test\nFlags: real\n');

    expect(() => parseRawFile(bytes)).toThrow(RawFileError);
    expect(() => parseRawFile(bytes)).toThrow('no binary data section');
  });

  it('rejects complex plots', () => {
    const bytes = buildRawFile(['time'], [[0]], { flags: 'complex' });

    expect(() => parseRawFile(bytes)).toThrow('only real plots');
  });

  it('rejects a truncated result', () => {
    const bytes = buildRawFile(
      ['time', 'v(3)'],
      [
        [0, 1],
        [1, 2],
      ],
    );

    expect(() => parseRawFile(bytes.slice(0, bytes.length - 4))).toThrow(
      'shorter than its header',
    );
  });

  it('rejects a variable list that does not match the count', () => {
    const bytes = buildRawFile(['time'], [[0]], { declaredVariables: 2 });

    expect(() => parseRawFile(bytes)).toThrow('names 1');
  });

  it('rejects a header whose counts are missing', () => {
    const bytes = new TextEncoder().encode(
      'Flags: real\nVariables:\nBinary:\n',
    );

    expect(() => parseRawFile(bytes)).toThrow('invalid');
  });

  it('rejects a header without a variable list', () => {
    const header = 'Flags: real\nNo. Variables: 1\nNo. Points: 1\nBinary:\n';
    const bytes = new Uint8Array([
      ...new TextEncoder().encode(header),
      ...new Uint8Array(8),
    ]);

    expect(() => parseRawFile(bytes)).toThrow('no variable list');
  });
});
