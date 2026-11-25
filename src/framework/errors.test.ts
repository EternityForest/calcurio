import { describe, expect, it } from 'vitest';
import { errorMessage } from './errors.js';

describe('errorMessage', () => {
  it('returns the message of a real Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns a thrown string unchanged', () => {
    expect(errorMessage('boom')).toBe('boom');
  });

  it('describes an Emscripten ExitStatus-like object', () => {
    const exitStatus = {
      name: 'ExitStatus',
      message: 'Program terminated with exit(1)',
      status: 1,
    };
    expect(errorMessage(exitStatus)).toBe(
      'ExitStatus: Program terminated with exit(1)',
    );
  });

  it('uses just the message when it has no distinct name', () => {
    expect(errorMessage({ message: 'plain failure' })).toBe('plain failure');
  });

  it('serializes an object without a message', () => {
    expect(errorMessage({ code: 42, detail: 'nope' })).toBe(
      '{"code":42,"detail":"nope"}',
    );
  });

  it('falls back to String for a circular object', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;
    expect(errorMessage(circular)).toBe('[object Object]');
  });

  it('stringifies primitive thrown values', () => {
    expect(errorMessage(42)).toBe('42');
    expect(errorMessage(null)).toBe('null');
    expect(errorMessage(undefined)).toBe('undefined');
  });
});
