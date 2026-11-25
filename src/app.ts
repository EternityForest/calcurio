import { CalculatorApp } from './framework/app.js';
import type { CategoryManifest } from './framework/types.js';

export const CATEGORY_MANIFEST = {
  basic: {
    title: 'Basic',
    description: 'Everyday electrical calculations.',
    load: () => import('./categories/basic/index.js'),
  },
} as const satisfies CategoryManifest;

export type App = CalculatorApp<typeof CATEGORY_MANIFEST>;

export const app: App = new CalculatorApp(CATEGORY_MANIFEST);
