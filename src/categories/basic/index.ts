import type { CategoryModule } from '../../framework/types.js';
import { ohmsLaw } from './ohms-law.js';

export const calculators: CategoryModule['calculators'] = [ohmsLaw];
