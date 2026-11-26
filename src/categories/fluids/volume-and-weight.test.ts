import { describe, expect, it } from 'vitest';
import { TableRegistry } from '../../framework/tables.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { materialsTable } from '../../models/materials.js';
import { volumeVsWeight } from '../materials/volume-vs-weight.js';

const registry = new TableRegistry([materialsTable]);

describe('Volume vs weight (materials alias)', () => {
  it('passes every definition test case', () => {
    expect(() =>
      assertCalculatorTests(volumeVsWeight, { tables: registry }),
    ).not.toThrow();
  });
});
