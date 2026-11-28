import type {
  CalculatorDefinition,
  VariableDefinition,
} from '../../framework/types.js';

/** Pitch classes in the order MIDI numbers cycle through them. */
const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

/** Semitones above C for each natural note letter. */
const LETTER_SEMITONES: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const NOTE_PATTERN = /^([A-Ga-g])([#b]?)(-?\d+)$/;

/** MIDI number of a note name such as C4, F#3, or Bb2. */
export function noteToMidi(note: string): number {
  const match = NOTE_PATTERN.exec(note.trim());
  if (match === null) {
    throw new RangeError(`"${note}" is not a note name such as C4 or F#3.`);
  }
  const letter = match[1]!.toUpperCase();
  const accidental = match[2] ?? '';
  const octave = Number(match[3]);
  const offset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
  return (octave + 1) * 12 + LETTER_SEMITONES[letter]! + offset;
}

/** Note name (sharp spelling) nearest a MIDI number. */
export function midiToNote(midi: number): string {
  const rounded = Math.round(midi);
  const pitchClass = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  return `${NOTE_NAMES[pitchClass]}${octave}`;
}

/** Frequency of a MIDI number under equal temperament at `tuning` Hz. */
export function midiToFrequency(midi: number, tuning: number): number {
  return tuning * 2 ** ((midi - 69) / 12);
}

/** MIDI number whose equal-tempered frequency is `frequency` at `tuning`. */
export function frequencyToMidi(frequency: number, tuning: number): number {
  return 69 + 12 * Math.log2(frequency / tuning);
}

/**
 * Builds the note, MIDI, and frequency variables for a tuning. All three are
 * equivalent representations of one pitch, so entering any of them fills the
 * others. The tuning is captured by the conversions and so must be set
 * through the calculator's config rather than as a runtime value.
 */
export function buildEqualTemperamentVariables(
  tuning: number,
): readonly VariableDefinition[] {
  return [
    {
      name: 'note',
      label: 'Note',
      description: 'Note name such as C4, F#3, or Bb2.',
      pattern: '^[A-Ga-g][#b]?-?\\d+$',
      equivalent: {
        midi: (value: string) => noteToMidi(value),
        frequency: (value: string) =>
          midiToFrequency(noteToMidi(value), tuning),
      },
    },
    {
      name: 'midi',
      label: 'MIDI number',
      unit: '1',
      description: 'MIDI note number, where 69 is A4.',
      equivalent: {
        note: (value: number) => midiToNote(value),
        frequency: (value: number) => midiToFrequency(value, tuning),
      },
    },
    {
      name: 'frequency',
      label: 'Frequency',
      unit: 'Hz',
      description: 'Equal-tempered frequency of the note.',
      equivalent: {
        note: (value: number) => midiToNote(frequencyToMidi(value, tuning)),
        midi: (value: number) => frequencyToMidi(value, tuning),
      },
    },
  ];
}

export const equalTemperament: CalculatorDefinition = {
  id: 'equal-temperament',
  title: 'Equal Temperament Notes',
  description:
    'Relate a note name, its MIDI number, and its frequency in equal ' +
    'temperament. Enter any one value and the other two follow.',
  config: [
    {
      name: 'tuning',
      label: 'Tuning (A4)',
      kind: 'number',
      default: 440,
      min: 1,
      description: 'Frequency of A4 in hertz.',
    },
  ],
  variables: buildEqualTemperamentVariables(440),
  buildVariables: (config) =>
    buildEqualTemperamentVariables(Number(config.tuning)),
  testCases: [
    { note: 'A4', midi: 69, frequency: 440 },
    { note: 'C4', midi: 60, frequency: 261.6255653005986 },
    { note: 'F#3', midi: 54, frequency: 184.99721135581723 },
    { note: 'Bb2', midi: 46, frequency: 116.54094037952248 },
    { note: 'A5', midi: 81, frequency: 880 },
  ],
};
