import { describe, expect, it } from 'vitest';
import { missing } from './missing.js';
import { CalculatorRuntime } from './runtime.js';
import type { CalculatorDefinition, VariableDefinition } from './types.js';

function definition(
  variables: readonly VariableDefinition[],
): CalculatorDefinition {
  return {
    id: 'wired',
    title: 'Wired',
    variables,
  };
}

describe('CalculatorRuntime wiring', () => {
  it('copies a value along a wire', () => {
    const runtime = new CalculatorRuntime(
      definition([
        { name: 'source', label: 'Source', unit: 'V' },
        { name: 'target', label: 'Target', unit: 'V', takeFrom: 'source' },
      ]),
    );
    runtime.setDisplayText('source', '2.5');
    expect(runtime.state['target']).toBeCloseTo(2.5);
  });

  it('converts units while copying a number', () => {
    const runtime = new CalculatorRuntime(
      definition([
        { name: 'source', label: 'Source', unit: 'V' },
        { name: 'target', label: 'Target', unit: 'mV', takeFrom: 'source' },
      ]),
    );
    runtime.setDisplayText('source', '1');
    expect(runtime.state['target']).toBeCloseTo(1000);
  });

  it('marks a wired variable read-only and names its source', () => {
    const runtime = new CalculatorRuntime(
      definition([
        { name: 'source', label: 'Source', unit: 'V' },
        { name: 'target', label: 'Target', unit: 'V', takeFrom: 'source' },
      ]),
    );
    expect(runtime.isWired('target')).toBe(true);
    expect(runtime.isEditable('target')).toBe(false);
    expect(runtime.sourceLabel('target')).toBe('Source');
    const result = runtime.setDisplayText('target', '9');
    expect(result.ok).toBe(false);
  });

  it('ignores a sendTo when no takeFrom names it', () => {
    const runtime = new CalculatorRuntime(
      definition([
        { name: 'seed', label: 'Seed', unit: 'V' },
        {
          name: 'source',
          label: 'Source',
          unit: 'V',
          sendTo: ['target'],
          computable: (state) =>
            typeof state['seed'] === 'number'
              ? state['seed']
              : missing(['seed']),
        },
        { name: 'target', label: 'Target', unit: 'V' },
      ]),
    );
    runtime.setDisplayText('seed', '4');
    expect(runtime.state['source']).toBeCloseTo(4);
    expect(runtime.state['target']).toBeNull();
  });

  it('wires a computed value to a later step in one recompute', () => {
    const runtime = new CalculatorRuntime(
      definition([
        { name: 'x', label: 'X', unit: 'V' },
        {
          name: 'doubled',
          label: 'Doubled',
          unit: 'V',
          computable: (state) =>
            typeof state['x'] === 'number' ? state['x'] * 2 : missing(['x']),
        },
        { name: 'relayed', label: 'Relayed', unit: 'V', takeFrom: 'doubled' },
        {
          name: 'final',
          label: 'Final',
          unit: 'V',
          computable: (state) =>
            typeof state['relayed'] === 'number'
              ? state['relayed'] + 1
              : missing(['relayed']),
        },
      ]),
    );
    runtime.setDisplayText('x', '3');
    expect(runtime.state['doubled']).toBeCloseTo(6);
    expect(runtime.state['relayed']).toBeCloseTo(6);
    expect(runtime.state['final']).toBeCloseTo(7);
    expect(runtime.isConverged).toBe(true);
    expect(runtime.errors).toHaveLength(0);
  });

  it('prefers the wired value over a variable has its own computable', () => {
    const runtime = new CalculatorRuntime(
      definition([
        { name: 'source', label: 'Source', unit: 'V' },
        {
          name: 'target',
          label: 'Target',
          unit: 'V',
          takeFrom: 'source',
          computable: () => 999,
        },
      ]),
    );
    runtime.setDisplayText('source', '5');
    expect(runtime.state['target']).toBeCloseTo(5);
  });

  it('chains wires that flow backwards within the round limit', () => {
    const runtime = new CalculatorRuntime(
      definition([
        { name: 'tail', label: 'Tail', unit: 'V', takeFrom: 'head' },
        {
          name: 'head',
          label: 'Head',
          unit: 'V',
          computable: (state) =>
            typeof state['seed'] === 'number'
              ? state['seed']
              : missing(['seed']),
        },
        { name: 'seed', label: 'Seed', unit: 'V' },
      ]),
    );
    runtime.setDisplayText('seed', '8');
    expect(runtime.state['head']).toBeCloseTo(8);
    expect(runtime.state['tail']).toBeCloseTo(8);
    expect(runtime.isConverged).toBe(true);
  });
});
