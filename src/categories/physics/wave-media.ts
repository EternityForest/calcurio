import type { TableDefinition } from '../../framework/types.js';

/**
 * Propagation media for radio and light, with the speed a wave travels and
 * the impedance it meets. For the bulk media (vacuum, air, PTFE) the speed is
 * the phase velocity and the impedance is the wave impedance of the material;
 * for the cables it is the nominal velocity factor and the characteristic
 * impedance of the line. Speeds and velocity factors are nominal values:
 * cable velocity factor depends on the dielectric, so check the datasheet for
 * a specific cable. Each row has a distinct speed so a medium can be recovered
 * from it.
 */
export const waveMediaTable: TableDefinition = {
  id: 'wave-media',
  title: 'Wave media',
  description:
    'Speed of light and characteristic impedance in common propagation ' +
    'media: the bulk dielectrics and the usual coax and twisted-pair cables.',
  keyColumn: 'id',
  labelColumn: 'label',
  columns: [
    { key: 'id', label: 'Media ID' },
    { key: 'label', label: 'Medium' },
    {
      key: 'speedOfLight',
      label: 'Speed of light',
      unit: 'm/s',
      description: 'Phase velocity of a wave in the medium.',
    },
    {
      key: 'impedance',
      label: 'Impedance',
      unit: 'ohm',
      description:
        'Wave impedance for a bulk medium, or characteristic impedance for ' +
        'a cable.',
    },
  ],
  rows: [
    {
      id: 'vacuum',
      label: 'Vacuum',
      speedOfLight: 299792458,
      impedance: 376.73,
    },
    {
      id: 'air',
      label: 'Air',
      speedOfLight: 299702547,
      impedance: 376.73,
    },
    {
      id: 'ptfe',
      label: 'PTFE',
      speedOfLight: 208355758,
      impedance: 259.97,
    },
    {
      id: 'cat5e',
      label: 'Cat5e',
      speedOfLight: 194865098,
      impedance: 100,
    },
    {
      id: 'rg58',
      label: 'RG-58 coax',
      speedOfLight: 197863022,
      impedance: 50,
    },
    {
      id: 'rg316',
      label: 'RG-316 coax',
      speedOfLight: 206856796,
      impedance: 50,
    },
    {
      id: 'rg400',
      label: 'RG-400 coax',
      speedOfLight: 209854721,
      impedance: 50,
    },
    {
      id: 'lmr400',
      label: 'LMR-400 coax',
      speedOfLight: 254823589,
      impedance: 50,
    },
  ],
};
