import type { CalculatorDefinition, TableSource } from '../../framework/types.js';
import { dataTransferTime } from './data-transfer-time.js';
import { hexBinary } from './hex-binary.js';
import { unixTime } from './unix-time.js';

export const tables: readonly TableSource[] = [];

export const calculators: readonly CalculatorDefinition[] = [hexBinary, unixTime, dataTransferTime];