import type { CalculatorDefinition } from '../../framework/types.js';

/** Generates a time-ordered UUIDv7 string. */
export function uuidv7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const now = Date.now();
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const uuidv7Calculator: CalculatorDefinition = {
  id: 'uuidv7',
  title: 'UUIDv7',
  description:
    'Generate a time-ordered UUIDv7. Press Calculate to generate a new value.',
  variables: [
    {
      name: 'uuid',
      label: 'UUIDv7',
      editable: false,
      autoUpdate: false,
      description:
        'Time-ordered UUIDv7. Press Calculate to generate a new value.',
      computable: () => uuidv7(),
    },
  ],
};
