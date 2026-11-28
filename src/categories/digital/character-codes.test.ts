import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import {
  characterCodes,
  characterToCode,
  codeToCharacter,
  formatCode,
  parseCode,
} from './character-codes.js';

describe('Character codes', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(characterCodes)).not.toThrow();
  });

  it('starts with no value in any field', () => {
    const calc = new CalculatorRuntime(characterCodes);
    expect(calc.state['character']).toBeNull();
    expect(calc.state['decimal']).toBeNull();
    expect(calc.state['hex']).toBeNull();
    expect(calc.state['binary']).toBeNull();
    expect(calc.state['octal']).toBeNull();
    expect(calc.errors).toEqual([]);
  });

  it('fills every base from a decimal code', () => {
    const calc = new CalculatorRuntime(characterCodes);
    calc.setDisplayText('decimal', '65');
    expect(calc.state['character']).toBe('A');
    expect(calc.state['hex']).toBe('0x41');
    expect(calc.state['binary']).toBe('0b1000001');
    expect(calc.state['octal']).toBe('0o101');
    expect(calc.errors).toEqual([]);
  });

  it('fills the codes from a character', () => {
    const calc = new CalculatorRuntime(characterCodes);
    calc.setDisplayText('character', 'a');
    expect(calc.state['decimal']).toBe(97);
    expect(calc.state['hex']).toBe('0x61');
    expect(calc.state['binary']).toBe('0b1100001');
    expect(calc.state['octal']).toBe('0o141');
  });

  it('reads a hex code with or without its prefix', () => {
    const calc = new CalculatorRuntime(characterCodes);
    calc.setDisplayText('hex', '41');
    expect(calc.state['character']).toBe('A');
    expect(calc.state['decimal']).toBe(65);
    expect(calc.state['binary']).toBe('0b1000001');
    expect(calc.state['octal']).toBe('0o101');
  });

  it('fills the character from a binary code', () => {
    const calc = new CalculatorRuntime(characterCodes);
    calc.setDisplayText('binary', '0b110000');
    expect(calc.state['character']).toBe('0');
    expect(calc.state['decimal']).toBe(48);
  });

  it('reports an error for more than one character', () => {
    const calc = new CalculatorRuntime(characterCodes);
    calc.setDisplayText('character', 'AB');
    expect(calc.errors.length).toBeGreaterThan(0);
  });

  it('reports an error for a code outside the character range', () => {
    const calc = new CalculatorRuntime(characterCodes);
    calc.setDisplayText('decimal', '99999999');
    expect(calc.errors.length).toBeGreaterThan(0);
  });

  it('converts characters and codes directly', () => {
    expect(characterToCode('A')).toBe(65);
    expect(characterToCode(' ')).toBe(32);
    expect(characterToCode('😀')).toBe(0x1f600);
    expect(() => characterToCode('AB')).toThrow();
    expect(() => characterToCode('')).toThrow();
    expect(codeToCharacter(65)).toBe('A');
    expect(() => codeToCharacter(-1)).toThrow();
    expect(() => codeToCharacter(0x110000)).toThrow();
    expect(formatCode(255, 16, '0x')).toBe('0xff');
    expect(parseCode('0xff', 16, '0x')).toBe(255);
    expect(parseCode('ff', 16, '0x')).toBe(255);
    expect(parseCode('0o101', 8, '0o')).toBe(65);
    expect(() => parseCode('0x', 16, '0x')).toThrow();
    expect(() => parseCode('12', 2, '0b')).toThrow();
  });
});
