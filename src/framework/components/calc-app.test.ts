// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalculatorApp } from '../app.js';
import type {
  CalculatorDefinition,
  CategoryManifest,
  CategoryModule,
} from '../types.js';
import { CalcApp } from './calc-app.js';

function sampleDefinition(): CalculatorDefinition {
  return {
    id: 'sample',
    title: 'Sample',
    description: 'A sample calculator.',
    variables: [
      {
        name: 'a',
        label: 'A',
        unit: 'V',
        computable: () => 1,
      },
      {
        name: 'b',
        label: 'B',
        unit: 'V',
      },
    ],
  };
}

function moduleWith(...definitions: CalculatorDefinition[]): CategoryModule {
  return { calculators: definitions };
}

async function mount(manifest: CategoryManifest): Promise<CalcApp> {
  const app = new CalculatorApp(manifest);
  const element = new CalcApp();
  element.app = app;
  document.body.append(element);
  await element.updateComplete;
  return element;
}

function button(element: CalcApp, testId: string): HTMLButtonElement {
  const found = element.querySelector<HTMLButtonElement>(
    `[data-testid="${testId}"]`,
  );
  if (found === null) {
    throw new Error(`Missing button ${testId}.`);
  }
  return found;
}

/** A stand-in hub element, to check how the app renders a manifest hub. */
class TestHub extends HTMLElement {
  declare handle: unknown;
  declare openCalculator: ((calculatorId: string) => void) | undefined;
  declare onChanged: (() => void) | undefined;

  connectedCallback(): void {
    this.textContent = 'hub content';
  }
}

customElements.define('test-hub', TestHub);

describe('CalcApp', () => {
  afterEach(() => {
    window.location.hash = '#';
    document.body.replaceChildren();
  });

  it('renders nothing without an app', async () => {
    const element = new CalcApp();
    document.body.append(element);
    await element.updateComplete;
    expect(element.textContent).toBe('');
  });

  it('renders the category list', async () => {
    const element = await mount({
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load: async () => moduleWith(),
      },
    });
    expect(element.textContent).toContain('Calculators');
    expect(element.textContent).toContain('Basic');
    expect(element.textContent).toContain('Basic calculators.');
  });

  it('lazily loads a category and shows its calculators', async () => {
    const load = vi.fn(async () => moduleWith(sampleDefinition()));
    const element = await mount({
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load,
      },
    });

    button(element, 'category-basic').click();
    await element.updateComplete;
    expect(element.textContent).toContain('Loading…');

    await vi.waitFor(() => {
      expect(
        element.querySelector('[data-testid="calculator-sample"]'),
      ).not.toBeNull();
    });
    expect(load).toHaveBeenCalledTimes(1);
    expect(element.textContent).toContain('A sample calculator.');
  });

  it('loads a category only once', async () => {
    const load = vi.fn(async () => moduleWith(sampleDefinition()));
    const element = await mount({
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load,
      },
    });

    button(element, 'category-basic').click();
    await vi.waitFor(() => {
      expect(
        element.querySelector('[data-testid="calculator-sample"]'),
      ).not.toBeNull();
    });
    button(element, 'back').click();
    await element.updateComplete;
    button(element, 'category-basic').click();
    await element.updateComplete;

    expect(load).toHaveBeenCalledTimes(1);
    expect(
      element.querySelector('[data-testid="calculator-sample"]'),
    ).not.toBeNull();
  });

  it('opens a calculator and returns through the category', async () => {
    const element = await mount({
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load: async () => moduleWith(sampleDefinition()),
      },
    });

    button(element, 'category-basic').click();
    await vi.waitFor(() => {
      expect(
        element.querySelector('[data-testid="calculator-sample"]'),
      ).not.toBeNull();
    });
    button(element, 'calculator-sample').click();
    await element.updateComplete;
    expect(element.querySelector('calc-calculator')).not.toBeNull();
    expect(element.textContent).toContain('Sample');

    button(element, 'back').click();
    await element.updateComplete;
    expect(
      element.querySelector('[data-testid="calculator-sample"]'),
    ).not.toBeNull();

    button(element, 'back').click();
    await element.updateComplete;
    expect(element.textContent).toContain('Calculators');
  });

  it('shows a load error and retries', async () => {
    const load = vi
      .fn<() => Promise<CategoryModule>>()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(moduleWith(sampleDefinition()));
    const element = await mount({
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load,
      },
    });

    button(element, 'category-basic').click();
    await vi.waitFor(() => {
      expect(element.textContent).toContain('Could not load Basic');
    });

    const retry = element.querySelector<HTMLButtonElement>('.alert button');
    if (retry === null) {
      throw new Error('Missing retry button.');
    }
    retry.click();
    await vi.waitFor(() => {
      expect(
        element.querySelector('[data-testid="calculator-sample"]'),
      ).not.toBeNull();
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('reports an empty category', async () => {
    const element = await mount({
      basic: {
        title: 'Basic',
        description: 'Basic calculators.',
        load: async () => moduleWith(),
      },
    });

    button(element, 'category-basic').click();
    await vi.waitFor(() => {
      expect(element.textContent).toContain('Nothing in this category yet.');
    });
  });

  it('renders a category hub in place of its tiles', async () => {
    const element = await mount({
      custom: {
        title: 'Custom',
        description: 'Build your own.',
        load: async () => moduleWith(),
        hub: 'test-hub',
      },
    });

    button(element, 'category-custom').click();
    await vi.waitFor(() => {
      expect(element.querySelector('test-hub')).not.toBeNull();
    });

    const hub = element.querySelector<TestHub>('test-hub');
    if (hub === null) {
      throw new Error('Missing hub element.');
    }
    expect(element.textContent).toContain('hub content');
    expect(element.textContent).not.toContain('Nothing in this category yet.');
    expect(hub.handle).toBeDefined();
    expect(typeof hub.openCalculator).toBe('function');
    expect(typeof hub.onChanged).toBe('function');
  });
});
