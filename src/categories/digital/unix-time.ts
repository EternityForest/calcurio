import type { CalculatorDefinition } from '../../framework/types.js';

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
      unit: 's',
      setterButtons: [
        {
          label: 'Set to Now',
          setter: () => Math.floor(Date.now() / 1000),
        },
      ],
      equivalent: {
        unixMillis: (v: number) => v * 1000,
        localTime: (s: number) => {
          // Convert to all formats
          const date = new Date(s*1000);
          const tzOffset = -date.getTimezoneOffset();
          const tzSign = tzOffset >= 0 ? '+' : '-';
          const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(
            2,
            '0',
          );
          const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');
          return `${date.toISOString().slice(0, -1)}${tzSign}${tzHours}:${tzMins}`;
        },

        utcTime: (millis: number) => {
          // Convert to all formats
          const date = new Date(millis*1000);
          return date.toISOString();
        },
      },
    },
    {
      name: 'unixMillis',
      unit: 'ms',
      label: 'UNIX Time (ms)',
      description: 'Milliseconds since January 1, 1970 00:00:00 UTC',
      equivalent: {
        unixSeconds: (v: number) => v / 1000,
        localTime: (millis: number) => {
          // Convert to all formats
          const date = new Date(millis);
          const tzOffset = -date.getTimezoneOffset();
          const tzSign = tzOffset >= 0 ? '+' : '-';
          const tzHours = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(
            2,
            '0',
          );
          const tzMins = String(Math.abs(tzOffset) % 60).padStart(2, '0');
          return `${date.toISOString().slice(0, -1)}${tzSign}${tzHours}:${tzMins}`;
        },

        utcTime: (millis: number) => {
          // Convert to all formats
          const date = new Date(millis);
          return date.toISOString();
        },
      },
    },
    {
      name: 'localTime',
      label: 'Local Time',
      description: 'ISO 8601 format with local timezone',

      equivalent: {
        unixSeconds: (localTs: string) => {
          // Normalize space separator to 'T' so ISO-like strings parse as local time, not UTC
          const normalized = localTs.trim().replace(' ', 'T');
          const date = new Date(normalized);

          if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid timestamp: ${localTs}`);
          }

          return date.getTime()/1000;
        },

        unixMillis: (localTs: string) => {
          // Normalize space separator to 'T' so ISO-like strings parse as local time, not UTC
          const normalized = localTs.trim().replace(' ', 'T');
          const date = new Date(normalized);

          if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid timestamp: ${localTs}`);
          }

          return date.getTime();
        },

        utcTime: (localTs: string) => {
          // Normalize space separator to 'T' so ISO-like strings parse as local time, not UTC
          const normalized = localTs.trim().replace(' ', 'T');
          const date = new Date(normalized);

          if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid timestamp: ${localTs}`);
          }

          return date.toISOString();
        },
      },
    },
    {
      name: 'utcTime',
      label: 'UTC Time',
      description: 'ISO 8601 format in UTC (Z suffix)',

      equivalent: {
        unixSeconds: (localTs: string) => {
          // Normalize space separator to 'T' so ISO-like strings parse as local time, not UTC
          const normalized = localTs.trim().replace(' ', 'T');
          const date = new Date(normalized);

          if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid timestamp: ${localTs}`);
          }

          return date.getTime()/1000;
        },

        unixMillis: (localTs: string) => {
          // Normalize space separator to 'T' so ISO-like strings parse as local time, not UTC
          const normalized = localTs.trim().replace(' ', 'T');
          const date = new Date(normalized);

          if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid timestamp: ${localTs}`);
          }

          return date.getTime();
        },
        localTime: (utcInput: string | Date) => {
          const date =
            typeof utcInput === 'string' ? new Date(utcInput) : utcInput;

          const pad = (n: number, len = 2) =>
            String(Math.floor(Math.abs(n))).padStart(len, '0');

          // getTimezoneOffset() returns minutes behind UTC (e.g., +420 for UTC-7), so invert the sign
          const tzOffset = -date.getTimezoneOffset();
          const sign = tzOffset >= 0 ? '+' : '-';
          const offsetHours = pad(tzOffset / 60);
          const offsetMinutes = pad(tzOffset % 60);

          return (
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
            `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}` +
            `${sign}${offsetHours}:${offsetMinutes}`
          );
        },
      },
    },
  ],
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
