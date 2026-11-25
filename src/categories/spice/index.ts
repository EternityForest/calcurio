import type { CategoryModule } from '../../framework/types.js';
import { inrushTransient } from './inrush.js';

export const calculators: CategoryModule['calculators'] = [inrushTransient];
