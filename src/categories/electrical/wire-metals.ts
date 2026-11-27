import type { TableDefinition } from '../../framework/types.js';

/**
 * Electrical resistivity of common conductor metals at 20 °C, expressed in
 * ohm square millimetres per metre so it multiplies directly with a length in
 * metres and divides by an area in square millimetres.
 */
export const wireMetalsTable: TableDefinition = {
  id: 'wire-metals',
  title: 'Wire metals',
  description:
    'Resistivity of common conductor metals at 20 °C, in ohm square ' +
    'millimetres per metre.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Metal ID' },
    { key: 'label', label: 'Metal' },
    {
      key: 'resistivity',
      label: 'Resistivity',
      unit: 'ohm mm^2/m',
      description: 'Resistance of a 1 m length with 1 mm² cross-section.',
    },
  ],
  rows: [
    { id: 'silver', label: 'Silver', resistivity: 0.0159 },
    { id: 'copper', label: 'Copper', resistivity: 0.0172 },
    {
      id: 'annealed-copper',
      label: 'Annealed copper',
      resistivity: 0.01724,
    },
    { id: 'gold', label: 'Gold', resistivity: 0.0244 },
    { id: 'aluminium', label: 'Aluminium', resistivity: 0.0282 },
    { id: 'zinc', label: 'Zinc', resistivity: 0.059 },
    { id: 'brass', label: 'Brass', resistivity: 0.064 },
    { id: 'nickel', label: 'Nickel', resistivity: 0.0699 },
    { id: 'bronze', label: 'Bronze', resistivity: 0.1 },
    { id: 'tin', label: 'Tin', resistivity: 0.109 },
    { id: 'iron', label: 'Iron', resistivity: 0.0961 },
    { id: 'steel', label: 'Steel', resistivity: 0.15 },
    { id: 'stainless-steel', label: 'Stainless steel', resistivity: 0.69 },
    { id: 'tungsten', label: 'Tungsten', resistivity: 0.056 },
    { id: 'titanium', label: 'Titanium', resistivity: 0.42 },
    { id: 'nichrome', label: 'Nichrome', resistivity: 1.1 },
    { id: 'lead', label: 'Lead', resistivity: 0.22 },
    { id: 'mercury', label: 'Mercury', resistivity: 0.96 },
  ],
};