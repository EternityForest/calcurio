import type { CalculatorDefinition } from '../../framework/types.js';

/**
 * Decode and encode IEEE 754 floating point values.
 * Shows the relationship between a floating point value and its
 * 32-bit (float) and 64-bit (double) binary representations.
 */
export const ieeeFloat: CalculatorDefinition = {
  id: 'ieee-float',
  title: 'IEEE float decoder',
  description:
    'Convert between floating point values and their IEEE 754 binary representations. ' +
    'Shows both 32-bit (single precision) and 64-bit (double precision) formats.',
  variables: [
    {
      name: 'floatValue',
      label: 'Floating point value',
      description: 'The floating point number',
    },
    {
      name: 'float32Hex',
      label: 'As 32-bit float',
      unit: 'hex',
      description: 'IEEE 754 32-bit single precision representation (with 0x prefix)',
      pattern: '^0x[0-9a-fA-F]{8}$',
    },
    {
      name: 'float64Hex',
      label: 'As 64-bit float',
      unit: 'hex',
      description: 'IEEE 754 64-bit double precision representation (with 0x prefix)',
      pattern: '^0x[0-9a-fA-F]{16}$',
    },
  ],
  equivalent: {
    floatValue: (value) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
      }
      return value;
    },
    float32Hex: (value) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
      }
      // Create a DataView to get the 32-bit hex representation
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setFloat32(0, value, false); // big-endian
      return view.getUint32(0, false);
    },
    float64Hex: (value) => {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
      }
      // Create a DataView to get the 64-bit hex representation
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, value, false); // big-endian
      // Get as two 32-bit values and combine
      const low = view.getUint32(0, false);
      const high = view.getUint32(4, false);
      return (BigInt(high) << 32n) | BigInt(low);
    },
  },
  testCases: [
    { floatValue: 1.0, float32Hex: 0x3f800000, float64Hex: 0x3ff0000000000000n },
    { floatValue: 3.1415927, float32Hex: 0x40490fd0, float64Hex: 0x400921fb54442d18n },
    { floatValue: -2.5, float32Hex: 0xc0200000, float64Hex: 0xc004000000000000n },
    { floatValue: 0.5, float32Hex: 0x3f000000, float64Hex: 0x3fe0000000000000n },
    { floatValue: 0.0, float32Hex: 0x0, float64Hex: 0x0n },
  ],
};