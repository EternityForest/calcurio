import { NumberFormatError } from './errors.js';

const MAX_SIGNIFICANT_DIGITS = 12;
const SCIENTIFIC_UPPER = 1e12;
const SCIENTIFIC_LOWER = 1e-6;

const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

/** Formats a finite number for display with at most 12 significant digits. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Cannot format non-finite value ${value}.`);
  }
  if (value === 0) {
    return '0';
  }
  const magnitude = Math.abs(value);
  if (magnitude >= SCIENTIFIC_UPPER || magnitude < SCIENTIFIC_LOWER) {
    return trimExponent(value.toExponential(MAX_SIGNIFICANT_DIGITS - 1));
  }
  const rounded = Number(value.toPrecision(MAX_SIGNIFICANT_DIGITS));
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

/**
 * Parses user input. Blank text means "no value" and returns null. Commas are
 * ignored so grouped values such as 1,200 are accepted.
 */
export function parseNumberText(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  const cleaned = trimmed.replace(/,/g, '');
  if (cleaned === '' || !NUMBER_PATTERN.test(cleaned)) {
    throw new NumberFormatError(`"${trimmed}" is not a number.`);
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    throw new NumberFormatError(`"${trimmed}" is out of range.`);
  }
  return value;
}

function trimExponent(text: string): string {
  const [mantissa, exponent] = text.split('e');
  if (mantissa === undefined || exponent === undefined) {
    return text;
  }
  const trimmedMantissa = mantissa
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/\.$/, '');
  const parsedExponent = Number(exponent);
  const sign = parsedExponent >= 0 ? '+' : '';
  return `${trimmedMantissa}e${sign}${parsedExponent}`;
}
