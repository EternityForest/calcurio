// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { VariableField } from './variable-field.js';
import type { NumberFieldModel } from './variable-field.js';

function fieldModel(
  overrides: Partial<NumberFieldModel> = {},
): NumberFieldModel {
  return {
    name: 'voltage',
    label: 'Voltage',
    description: 'Potential difference.',
    value: '12',
    placeholder: 'Needs current',
    unit: 'mV',
    unitChoices: ['mV', 'V'],
    editable: true,
    computable: true,
    pinned: false,
    issues: [],
    ...overrides,
  };
}

async function mount(model: FieldModel): Promise<VariableField> {
  const field = new VariableField();
  field.model = model;
  document.body.append(field);
  await field.updateComplete;
  return field;
}

function inputOf(field: VariableField): HTMLInputElement {
  const input = field.querySelector<HTMLInputElement>('input.calc-value-input');
  if (input === null) {
    throw new Error('Missing value input.');
  }
  return input;
}

function selectOf(field: VariableField): HTMLSelectElement {
  const select = field.querySelector<HTMLSelectElement>('select');
  if (select === null) {
    throw new Error('Missing unit selector.');
  }
  return select;
}

describe('VariableField', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
  });

  it('renders the label, value, units, and Calculate button', async () => {
    const field = await mount(fieldModel());
    expect(field.textContent).toContain('Voltage');
    expect(field.textContent).toContain('Potential difference.');
    expect(inputOf(field).value).toBe('12');
    expect(inputOf(field).readOnly).toBe(false);
    expect(selectOf(field).value).toBe('mV');
    expect(selectOf(field).options).toHaveLength(2);
    expect(field.querySelector('button.calc-calculate')).not.toBeNull();
  });

  it('hides Calculate for non-computable variables', async () => {
    const field = await mount(fieldModel({ computable: false }));
    expect(field.querySelector('button.calc-calculate')).toBeNull();
  });

  it('marks read-only fields', async () => {
    const field = await mount(fieldModel({ editable: false }));
    expect(inputOf(field).readOnly).toBe(true);
  });

  it('shows the placeholder and pinned badge', async () => {
    const field = await mount(fieldModel({ value: '', pinned: true }));
    expect(inputOf(field).placeholder).toBe('Needs current');
    expect(field.textContent).toContain('input');
  });

  it('commits on change', async () => {
    const field = await mount(fieldModel());
    const onCommit = vi.fn(() => ({ ok: true }));
    field.onCommit = onCommit;
    const input = inputOf(field);
    input.value = '24';
    input.dispatchEvent(new Event('change'));
    expect(onCommit).toHaveBeenCalledWith('24');
  });

  it('debounces commits while typing', async () => {
    vi.useFakeTimers();
    const field = await mount(fieldModel());
    const onCommit = vi.fn(() => ({ ok: true }));
    field.onCommit = onCommit;
    const input = inputOf(field);
    input.value = '24';
    input.dispatchEvent(new Event('input'));
    expect(onCommit).not.toHaveBeenCalled();
    vi.advanceTimersByTime(250);
    expect(onCommit).toHaveBeenCalledWith('24');
  });

  it('shows a local error when a commit is rejected', async () => {
    const field = await mount(fieldModel());
    field.onCommit = () => ({ ok: false, message: 'Bad value.' });
    const input = inputOf(field);
    input.value = 'nope';
    input.dispatchEvent(new Event('change'));
    await field.updateComplete;
    expect(field.textContent).toContain('Bad value.');
  });

  it('reports unit changes', async () => {
    const field = await mount(fieldModel());
    const onUnitChange = vi.fn();
    field.onUnitChange = onUnitChange;
    const select = selectOf(field);
    select.value = 'V';
    select.dispatchEvent(new Event('change'));
    expect(onUnitChange).toHaveBeenCalledWith('V');
  });

  it('calculates after committing the current text', async () => {
    const field = await mount(fieldModel());
    const onCommit = vi.fn(() => ({ ok: true }));
    const onCalculate = vi.fn();
    field.onCommit = onCommit;
    field.onCalculate = onCalculate;
    const button = field.querySelector<HTMLButtonElement>(
      'button.calc-calculate',
    );
    if (button === null) {
      throw new Error('Missing Calculate button.');
    }
    button.click();
    expect(onCommit).toHaveBeenCalled();
    expect(onCalculate).toHaveBeenCalled();
  });

  it('does not calculate when the commit fails', async () => {
    const field = await mount(fieldModel());
    const onCalculate = vi.fn();
    field.onCommit = () => ({ ok: false, message: 'Bad value.' });
    field.onCalculate = onCalculate;
    const button = field.querySelector<HTMLButtonElement>(
      'button.calc-calculate',
    );
    if (button === null) {
      throw new Error('Missing Calculate button.');
    }
    button.click();
    expect(onCalculate).not.toHaveBeenCalled();
  });
});
