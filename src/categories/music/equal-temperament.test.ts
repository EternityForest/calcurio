import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import {
  equalTemperament,
  frequencyToMidi,
  midiToFrequency,
  midiToNote,
  noteToMidi,
} from './equal-temperament.js';

describe('Equal temperament notes', () => {
  it('passes every definition test case', () => {
    expect(() => assertCalculatorTests(equalTemperament)).not.toThrow();
  });

  it('starts with no value in any field', () => {
    const calc = new CalculatorRuntime(equalTemperament);
    expect(calc.state['note']).toBeNull();
    expect(calc.state['midi']).toBeNull();
    expect(calc.state['frequency']).toBeNull();
    expect(calc.errors).toEqual([]);
  });

  it('fills the MIDI number and frequency from a note name', () => {
    const calc = new CalculatorRuntime(equalTemperament);
    calc.setDisplayText('note', 'C4');
    expect(calc.state['midi']).toBeCloseTo(60, 9);
    expect(calc.state['frequency']).toBeCloseTo(261.6255653005986, 9);
    expect(calc.errors).toEqual([]);
  });

  it('fills the note name and frequency from a MIDI number', () => {
    const calc = new CalculatorRuntime(equalTemperament);
    calc.setDisplayText('midi', '69');
    expect(calc.state['note']).toBe('A4');
    expect(calc.state['frequency']).toBeCloseTo(440, 9);
  });

  it('fills the note name and MIDI number from a frequency', () => {
    const calc = new CalculatorRuntime(equalTemperament);
    calc.setDisplayText('frequency', '880');
    expect(calc.state['note']).toBe('A5');
    expect(calc.state['midi']).toBeCloseTo(81, 9);
  });

  it('uses the tuning setting for A4', () => {
    const calc = new CalculatorRuntime(equalTemperament, undefined, {
      tuning: 442,
    });
    calc.setDisplayText('note', 'A4');
    expect(calc.state['frequency']).toBeCloseTo(442, 9);
    expect(calc.state['midi']).toBeCloseTo(69, 9);
  });

  it('re-derives the frequency when the tuning changes', () => {
    const calc = new CalculatorRuntime(equalTemperament);
    calc.setDisplayText('note', 'A4');
    expect(calc.state['frequency']).toBeCloseTo(440, 9);
    calc.setConfig({ tuning: 442 });
    expect(calc.state['frequency']).toBeCloseTo(442, 9);
  });

  it('reports an error for an unparseable note name', () => {
    const calc = new CalculatorRuntime(equalTemperament);
    calc.setDisplayText('note', 'H9');
    expect(calc.errors.length).toBeGreaterThan(0);
  });

  it('parses and spells note names', () => {
    expect(noteToMidi('C4')).toBe(60);
    expect(noteToMidi('A4')).toBe(69);
    expect(noteToMidi('F#3')).toBe(54);
    expect(noteToMidi('Bb2')).toBe(46);
    expect(noteToMidi('Cb4')).toBe(59);
    expect(noteToMidi('B#3')).toBe(60);
    expect(() => noteToMidi('nope')).toThrow();
    expect(midiToNote(60)).toBe('C4');
    expect(midiToNote(69)).toBe('A4');
    expect(midiToNote(54)).toBe('F#3');
    expect(midiToNote(61)).toBe('C#4');
  });

  it('round-trips MIDI numbers through frequency', () => {
    for (const midi of [21, 46, 60, 69, 81, 108]) {
      const frequency = midiToFrequency(midi, 440);
      expect(frequencyToMidi(frequency, 440)).toBeCloseTo(midi, 9);
    }
  });
});
