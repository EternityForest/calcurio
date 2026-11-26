import type { CalculatorDefinition } from '../../framework/types.js';

/**
 * Convert between binary, hexadecimal, and decimal integer representations.
 * All three fields are equivalent representations of the same value.
 */
export const hexBinary: CalculatorDefinition = {
  id: 'hex-binary',
  title: 'Hex / Binary',
  description:
    'Convert between binary, hexadecimal, and decimal integer representations. ' +
    'All three fields show the same value in different formats.',
  variables: [
    {
      name: 'binary',
      label: 'Binary',
      description: 'Binary representation (string of 0s and 1s)',
      pattern: '^[01]+$',
    },
    {
      name: 'hex',
      label: 'Hex',
      description: 'Hexadecimal representation (with 0x prefix)',
      pattern: '^0x[0-9a-fA-F]+$',
    },
    {
      name: 'decimal',
      label: 'Decimal',
      description: 'Decimal integer representation',
      pattern: '^\\d+$',
    },
  ],
  equivalent: {
    decimal: (value) => {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        return null;
      }
      return value;
    },
    hex: (value) => {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        return null;
      }
      return value;
    },
    binary: (value) => {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        return null;
      }
      return value;
    },
  },
  testCases: [
    { binary: '1010', hex: '0xa', decimal: 10 },
    { binary: '11111111', hex: '0xff', decimal: 255 },
    { binary: '100000000', hex: '0x100', decimal: 256 },
    { hex: '0xdeadbeef', decimal: 3735928559, binary: '11011110101011011011111011101111' },
  ],
};