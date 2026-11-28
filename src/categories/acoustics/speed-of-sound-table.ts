import type { TableDefinition } from '../../framework/types.js';

/**
 * Speed of sound in common media. Uses 2D lookup with temperature and pressure
 * as axes. The speed column contains sampled values in the format
 * "speed@temp,pressure; speed@temp,pressure" for interpolation.
 */
export const speedOfSoundTable: TableDefinition = {
  id: 'speed-of-sound',
  title: 'Speed of sound',
  description:
    'Speed of sound in common propagation media at various temperatures ' +
    'and pressures. Use temperature (and optionally pressure) to interpolate.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Media ID' },
    { key: 'label', label: 'Medium' },
    {
      key: 'temperature',
      label: 'Temperature',
      unit: 'degC',
      description: 'Temperature for lookup interpolation.',
    },
    {
      key: 'pressure',
      label: 'Pressure',
      unit: 'kPa',
      description: 'Pressure for lookup interpolation (optional, defaults to standard).',
    },
    {
      key: 'speed',
      label: 'Speed of Sound',
      kind: 'lookup',
      unit: 'm/s@degC,kPa',
      description: 'Speed of sound (2D lookup from temperature and pressure).',
      standards: { degC: 20, kPa: 101.325 },
    },
  ],
  rows: [
    {
      id: 'air',
      label: 'Air',
      temperature: 20,
      pressure: 101.325,
      // 2D lookup samples: speed at temperature, pressure
      // Format: "speed@temp,pressure; ..."
      speed: '331.3@0,101.325; 343@20,101.325; 346@25,101.325; 353@40,101.325',
    },
    {
      id: 'water',
      label: 'Water',
      temperature: 20,
      pressure: 101.325,
      speed: '1402@0,101.325; 1481@20,101.325; 1493@25,101.325; 1525@40,101.325',
    },
  ],
};
