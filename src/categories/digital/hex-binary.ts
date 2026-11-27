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
      equivalent: {
        hex: (value: string) => {
          return '0x' + parseInt(value).toString(16);
        },
        decimal: (value: string) => {
          return parseInt(value)
        },
      },
    },
    {
      name: 'hex',
      label: 'Hex',
      description: 'Hexadecimal representation (with 0x prefix)',
      pattern: '^0x[0-9a-fA-F]+$',
      equivalent: {
        binary: (value: string) => {
          return '0b' + parseInt(value).toString(2);
        },
        decimal: (value: string) => {
          return parseInt(value)
        },
      },
    },
    {
      name: 'decimal',
      label: 'Decimal',
      description: 'Decimal integer representation',
      unit:"1",
      equivalent: {
        hex: (value: string) => {
          return '0x' + parseInt(value).toString(16);
        },
        binary: (value: string) => {
          return '0b' + parseInt(value).toString(2);
        },
      },
    },
  ],

  testCases: [
    { binary: '1010', hex: '0xa', decimal: 10 },
    { binary: '11111111', hex: '0xff', decimal: 255 },
    { binary: '100000000', hex: '0x100', decimal: 256 },
    {
      hex: '0xdeadbeef',
      decimal: 3735928559,
      binary: '11011110101011011011111011101111',
    },
  ],
};
