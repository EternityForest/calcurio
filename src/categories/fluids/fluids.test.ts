import { describe, expect, it } from 'vitest';
import { validateTableDefinition } from '../../framework/tables.js';
import { fluidsTable } from './fluids.js';

describe('fluids table alias', () => {
  it('points at the shared materials table', () => {
    expect(() => validateTableDefinition(fluidsTable)).not.toThrow();
  });
});
