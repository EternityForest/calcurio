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
  geometry: {
    title: 'Geometry',
    description: 'Circles, spheres, polygons, and right-triangle geometry.',
    load: () => import('./categories/geometry/index.js'),
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
  materials: {
    title: 'Materials',
    description:
      'Thermal and bulk properties of solids and liquids, including latent ' +
      'heat and temperature-dependent specific heat.',
    load: () => import('./categories/materials/index.js'),
  },
  physics: {
    title: 'Physics',
    description: 'Wave propagation, kinetic energy, and the speed of light in media.',
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
  digital: {
    title: 'Digital',
    description: 'Binary, hex, UNIX time, and data transfer calculations.',
    load: () => import('./categories/digital/index.js'),
  },
  random: {
    title: 'Random',
    description: 'UUIDs, random numbers, and random choices.',
    load: () => import('./categories/random/index.js'),
  },
  finance: {
    title: 'Finance',
    description: 'Currency conversion with live exchange rates.',
    load: () => import('./categories/finance/index.js'),
  },
  custom: {
    title: 'Custom',
    description: 'Build your own multistep calculators.',
    load: () => import('./categories/custom/index.js'),
    hub: 'calc-custom-hub',
  },
  speed: {
    title: 'Speed',
    description: 'Speed, distance, and time relationships.',
    load: () => import('./categories/speed/index.js'),
  },
  acoustics: {
    title: 'Acoustics',
    description: 'Sound delay and travel time in various media.',
    load: () => import('./categories/acoustics/index.js'),
  },
  music: {
    title: 'Music',
    description: 'Notes, MIDI numbers, and equal-temperament frequencies.',
    load: () => import('./categories/music/index.js'),
  },
} as const satisfies CategoryManifest;

export type App = CalculatorApp<typeof CATEGORY_MANIFEST>;

export const app: App = new CalculatorApp(CATEGORY_MANIFEST);
