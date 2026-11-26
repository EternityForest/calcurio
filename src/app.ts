import { CalculatorApp } from './framework/app.js';
import type { CategoryManifest } from './framework/types.js';

export const CATEGORY_MANIFEST = {
  electrical: {
    title: 'Electrical',
    description: 'Everyday electrical calculations.',
    load: () => import('./categories/electrical/index.js'),
  },
  math: {
    title: 'Math',
    description: 'Arithmetic primitives and a general expression evaluator.',
    load: () => import('./categories/math/index.js'),
  },
  mechanical: {
    title: 'Mechanical',
    description: 'Cable tension, stored energy, and other mechanical work.',
    load: () => import('./categories/mechanical/index.js'),
  },
  fluids: {
    title: 'Fluids',
    description:
      'Working-fluid properties and flow through pipes and orifices.',
    load: () => import('./categories/fluids/index.js'),
  },
  physics: {
    title: 'Physics',
    description: 'Wave propagation and the speed of light in media.',
    load: () => import('./categories/physics/index.js'),
  },
  spice: {
    title: 'SPICE',
    description: 'Transient circuit simulations run in the browser.',
    load: () => import('./categories/spice/index.js'),
  },
  conversions: {
    title: 'Conversions',
    description: 'Everyday unit conversions between equivalent measures.',
    load: () => import('./categories/conversions/index.js'),
  },
  custom: {
    title: 'Custom',
    description: 'Build your own multistep calculators.',
    load: () => import('./categories/custom/index.js'),
    hub: 'calc-custom-hub',
  },
} as const satisfies CategoryManifest;

export type App = CalculatorApp<typeof CATEGORY_MANIFEST>;

export const app: App = new CalculatorApp(CATEGORY_MANIFEST);
