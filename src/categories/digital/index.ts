import type { CalculatorDefinition, TableSource } from '../../framework/types.js';
import { hexBinary } from './hex-binary.js';
import { ieeeFloat } from './ieee-float.js';

export const tables: readonly TableSource[] = [];

export const calculators: readonly CalculatorDefinition[] = [hexBinary, ieeeFloat];