import { CalculatorApp } from './framework/app.js';
import type { CategoryManifest } from './framework/types.js';

export const CATEGORY_MANIFEST = {
  basic: {
    title: 'Basic',
    description: 'Everyday electrical calculations.',
    load: () => import('./categories/basic/index.js'),
  },
  wire: {
    title: 'Wire',
    description: 'Wire sizes, conductor metals, and resistance.',
    load: () => import('./categories/wire/index.js'),
  },
  spice: {
    title: 'SPICE',
    description: 'Transient circuit simulations run in the browser.',
    load: () => import('./categories/spice/index.js'),
  },
  fluids: {
    title: 'Fluids',
    description: 'Working-fluid properties and volume-to-weight.',
    load: () => import('./categories/fluids/index.js'),
  },
  conversions: {
    title: 'Conversions',
    description: 'Everyday unit conversions between equivalent measures.',
    load: () => import('./categories/conversions/index.js'),
  },
} as const satisfies CategoryManifest;

export type App = CalculatorApp<typeof CATEGORY_MANIFEST>;

export const app: App = new CalculatorApp(CATEGORY_MANIFEST);
