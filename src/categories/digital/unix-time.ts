import type { CalculatorDefinition, CalcState } from '../../framework/types.js';

/**
 * Convert between UNIX time representations:
 * - Seconds since epoch
 * - Milliseconds since epoch
 * - Local ISO string with timezone
 * - UTC ISO string
 */
export const unixTime: CalculatorDefinition = {
  id: 'unix-time',
  title: 'UNIX Time',
  description:
    'Convert between UNIX timestamp representations. ' +
    'All fields show the same point in time in different formats.',
  variables: [
    {
      name: 'unixSeconds',
      label: 'UNIX Time (seconds)',
      description: 'Seconds since January 1, 1970 00:00:00 UTC',
      setterButtons: [
        {
          label: 'Set to Now',
          setter: () => Math.floor(Date.now() / 1000),
        },
      ],
    },
    {
      name: 'unixMillis',
      label: 'UNIX Time (ms)',
      description: 'Milliseconds since January 1, 1970 00:00:00 UTC',
    },
    {
      name: 'localTime',
      label: 'Local Time',
      description: 'ISO 8601 format with local timezone',
    },
    {
      name: 'utcTime',
      label: 'UTC Time',
      description: 'ISO 8601 format in UTC (Z suffix)',
    },
  ],
  // All computable variables return unchanged() because computeState produces the values
  // Using computeState for string <-> number conversions that aren't possible with equivalent
  computeState: (state: Readonly<CalcState>): CalcState => {
    // Get the canonical millisecond value from any available source
    let millis: number | null = null;

    // Priority order: unixMillis > unixSeconds > localTime > utcTime
    if (typeof state.unixMillis === 'number' && Number.isFinite(state.unixMillis)) {
      millis = state.unixMillis;
    } else if (typeof state.unixSeconds === 'number' && Number.isFinite(state.unixSeconds)) {
      millis = state.unixSeconds * 1000;
    } else if (typeof state.localTime === 'string' && state.localTime !== '') {
      const date = new Date(state.localTime);
      if (!isNaN(date.getTime())) {
        millis = date.getTime();
      }
    } else if (typeof state.utcTime === 'string' && state.utcTime !== '') {
      const date = new Date(state.utcTime);
      if (!isNaN(date.getTime())) {
        millis = date.getTime();
      }
    }

    // If nothing available, return empty state (all will show as missing)
    if (millis === null) {
      return {};
    }

    // Convert to all formats
    const date = new Date(millis);
    const tzOffset = -date.getTimezoneOffset();
    const tzSign = tzOffset >= 0 ? '+' : '-';
    const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');
    const localIso = `${date.toISOString().slice(0, -1)}${tzSign}${tzHours}:${tzMins}`;
    const utcIso = date.toISOString();

    return {
      unixSeconds: Math.floor(millis / 1000),
      unixMillis: millis,
      localTime: localIso,
      utcTime: utcIso,
    };
  },
  testCases: [
    {
      unixSeconds: 0,
      unixMillis: 0,
      localTime: '1970-01-01T00:00:00.000+00:00',
      utcTime: '1970-01-01T00:00:00.000Z',
    },
    {
      unixSeconds: 1609459200,
      unixMillis: 1609459200000,
      localTime: '2021-01-01T00:00:00.000+00:00',
      utcTime: '2021-01-01T00:00:00.000Z',
    },
  ],
};