import type {
  CalculatorDefinition,
  VariableDefinition,
} from '../../framework/types.js';

/** Largest Unicode code point; ASCII codes are the common subset. */
const MAX_CODE_POINT = 0x10ffff;

/** Valid digits for each radix this calculator reads. */
const DIGITS_PATTERN: Readonly<Record<number, RegExp>> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  16: /^[0-9a-f]+$/,
};

/** One numeric representation of a character code. */
interface RadixFormat {
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly pattern: string;
  readonly radix: number;
  readonly prefix: string;
}

const RADIX_FORMATS: readonly RadixFormat[] = [
  {
    name: 'hex',
    label: 'Hex',
    description: 'Hexadecimal character code with a 0x prefix.',
    pattern: '^(0x)?[0-9a-fA-F]+$',
    radix: 16,
    prefix: '0x',
  },
  {
    name: 'binary',
    label: 'Binary',
    description: 'Binary character code with a 0b prefix.',
    pattern: '^(0b)?[01]+$',
    radix: 2,
    prefix: '0b',
  },
  {
    name: 'octal',
    label: 'Octal',
    description: 'Octal character code with a 0o prefix.',
    pattern: '^(0o)?[0-7]+$',
    radix: 8,
    prefix: '0o',
  },
];

/** Code point of a single character such as A or 7. */
export function characterToCode(text: string): number {
  const points = Array.from(text);
  if (points.length !== 1) {
    throw new RangeError(`"${text}" is not a single character.`);
  }
  const code = points[0]!.codePointAt(0);
  if (code === undefined) {
    throw new RangeError(`"${text}" is not a single character.`);
  }
  return code;
}

/** Character whose code point is `code`. */
export function codeToCharacter(code: number): string {
  const rounded = Math.round(code);
  if (rounded < 0 || rounded > MAX_CODE_POINT) {
    throw new RangeError(`${code} is not a valid character code.`);
  }
  return String.fromCodePoint(rounded);
}

/** Renders a code point in a radix with its prefix, such as `0x41`. */
export function formatCode(
  code: number,
  radix: number,
  prefix: string,
): string {
  return prefix + Math.round(code).toString(radix);
}

/** Reads a code point from a radix number such as `41`, `0x41`, or `0b...`. */
export function parseCode(text: string, radix: number, prefix: string): number {
  const trimmed = text.trim().toLowerCase();
  const body = trimmed.startsWith(prefix)
    ? trimmed.slice(prefix.length)
    : trimmed;
  const pattern = DIGITS_PATTERN[radix];
  if (pattern === undefined || !pattern.test(body)) {
    throw new RangeError(`"${text}" is not a base-${radix} number.`);
  }
  const value = parseInt(body, radix);
  if (value > MAX_CODE_POINT) {
    throw new RangeError(`"${text}" is outside the character range.`);
  }
  return value;
}

/** Conversions from a single character to every numeric representation. */
function characterEquivalents(): Readonly<
  Record<string, (value: string) => number | string>
> {
  const equivalents: Record<string, (value: string) => number | string> = {
    decimal: (value: string) => characterToCode(value),
  };
  for (const format of RADIX_FORMATS) {
    equivalents[format.name] = (value: string) =>
      formatCode(characterToCode(value), format.radix, format.prefix);
  }
  return equivalents;
}

/** Conversions from the decimal code to the character and other bases. */
function decimalEquivalents(): Readonly<
  Record<string, (value: number) => number | string>
> {
  const equivalents: Record<string, (value: number) => number | string> = {
    character: (value: number) => codeToCharacter(value),
  };
  for (const format of RADIX_FORMATS) {
    equivalents[format.name] = (value: number) =>
      formatCode(value, format.radix, format.prefix);
  }
  return equivalents;
}

/** Conversions from one radix representation to the character and the rest. */
function radixEquivalents(
  format: RadixFormat,
): Readonly<Record<string, (value: string) => number | string>> {
  const equivalents: Record<string, (value: string) => number | string> = {
    character: (value: string) =>
      codeToCharacter(parseCode(value, format.radix, format.prefix)),
    decimal: (value: string) => parseCode(value, format.radix, format.prefix),
  };
  for (const other of RADIX_FORMATS) {
    if (other.name === format.name) {
      continue;
    }
    equivalents[other.name] = (value: string) =>
      formatCode(
        parseCode(value, format.radix, format.prefix),
        other.radix,
        other.prefix,
      );
  }
  return equivalents;
}

/** Variables for the character-code calculator, in declaration order. */
function buildCharacterCodeVariables(): readonly VariableDefinition[] {
  const variables: VariableDefinition[] = [
    {
      name: 'character',
      label: 'Character',
      description: 'A single character, such as A or 7.',
      pattern: '^.$',
      equivalent: characterEquivalents(),
    },
    {
      name: 'decimal',
      label: 'Decimal',
      unit: '1',
      description: 'Decimal character code.',
      equivalent: decimalEquivalents(),
    },
  ];
  for (const format of RADIX_FORMATS) {
    variables.push({
      name: format.name,
      label: format.label,
      description: format.description,
      pattern: format.pattern,
      equivalent: radixEquivalents(format),
    });
  }
  return variables;
}

/**
 * Relates a character to its decimal, hexadecimal, binary, and octal codes.
 * Every field is an equivalent representation of the same code point, so
 * entering any one fills the others.
 */
export const characterCodes: CalculatorDefinition = {
  id: 'character-codes',
  title: 'Character Codes',
  description:
    'Convert between a character and its decimal, hex, binary, and octal ' +
    'character codes.',
  variables: buildCharacterCodeVariables(),
  testCases: [
    {
      character: 'A',
      decimal: 65,
      hex: '0x41',
      binary: '0b1000001',
      octal: '0o101',
    },
    {
      character: '0',
      decimal: 48,
      hex: '0x30',
      binary: '0b110000',
      octal: '0o60',
    },
    {
      character: ' ',
      decimal: 32,
      hex: '0x20',
      binary: '0b100000',
      octal: '0o40',
    },
    {
      character: 'a',
      decimal: 97,
      hex: '0x61',
      binary: '0b1100001',
      octal: '0o141',
    },
    {
      character: '~',
      decimal: 126,
      hex: '0x7e',
      binary: '0b1111110',
      octal: '0o176',
    },
  ],
};
