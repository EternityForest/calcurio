/**
 * DIPPR equation 101, the standard five-parameter correlation used for
 * temperature-dependent fluid properties:
 *
 *   Y = exp(A + B / T + C · ln T + D · T^E)
 *
 * The temperature is in kelvin and the result is in whatever unit the fitted
 * coefficients were regressed in, so the vapor-pressure set returns pascals
 * and the liquid-viscosity set returns pascal seconds. Both sets come from
 * the same equation, which is why they share this one implementation.
 */
export interface Dippr101Coefficients {
  readonly a: number;
  readonly b: number;
  readonly c: number;
  readonly d: number;
  readonly e: number;
}

/** Evaluates DIPPR equation 101 at a temperature in kelvin. */
export function dippr101(
  coefficients: Dippr101Coefficients,
  temperature: number,
): number {
  const { a, b, c, d, e } = coefficients;
  return Math.exp(
    a + b / temperature + c * Math.log(temperature) + d * temperature ** e,
  );
}
