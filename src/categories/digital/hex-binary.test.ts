import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { hexBinary } from './hex-binary.js';

describe('Hex / Binary', () => {
  it('converts string to string (binary to hex)', () => {
    const calc = new CalculatorRuntime(hexBinary);
    calc.setDisplayText('binary', '1010');
    expect(calc.state['hex']).toBe('0xa');
    expect(calc.state['decimal']).toBe(10);
    expect(calc.errors).toEqual([]);
  });

  it('converts string to number (hex to decimal)', () => {
    const calc = new CalculatorRuntime(hexBinary);
    calc.setDisplayText('hex', '0xff');
    expect(calc.state['binary']).toBe('0b11111111');
    expect(calc.state['decimal']).toBe(255);
    expect(calc.errors).toEqual([]);
  });

  it('converts number to string (decimal to binary)', () => {
    const calc = new CalculatorRuntime(hexBinary);
    calc.setDisplayText('decimal', '255');
    expect(calc.state['binary']).toBe('0b11111111');
    expect(calc.state['hex']).toBe('0xff');
    expect(calc.errors).toEqual([]);
  });
});