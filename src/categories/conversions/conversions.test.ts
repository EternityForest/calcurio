import { describe, expect, it } from 'vitest';
import { CalculatorRuntime } from '../../framework/runtime.js';
import { assertCalculatorTests } from '../../framework/testing.js';
import { isNumberVariable } from '../../framework/types.js';
import { lengthConversion } from './length.js';
import { speedConversion } from './speed.js';
import { temperatureConversion } from './temperature.js';
import { volumeConversion } from './volume.js';
import { weightConversion } from './weight.js';

const CALCULATORS = [
  lengthConversion,
  volumeConversion,
  temperatureConversion,
  weightConversion,
  speedConversion,
];

describe('Conversions', () => {
  it('builds every calculator from equivalent variables only', () => {
    for (const definition of CALCULATORS) {
      expect(() => assertCalculatorTests(definition)).not.toThrow();
      for (const variable of definition.variables) {
        expect(isNumberVariable(variable)).toBe(true);
        if (!isNumberVariable(variable)) {
          continue;
        }
        expect(variable.equivalent).toBeDefined();
        expect(variable.computable).toBeUndefined();
      }
    }
  });
});

describe('Length conversion', () => {
  it('converts inches into centimetres and feet', () => {
    const calc = new CalculatorRuntime(lengthConversion);
    calc.setDisplayText('inches', '12');
    expect(calc.state['feet']).toBeCloseTo(1, 9);
    expect(calc.state['centimetres']).toBeCloseTo(30.48, 3);
    expect(calc.errors).toEqual([]);
  });
});

describe('Volume conversion', () => {
  it('converts gallons into litres and cubic feet', () => {
    const calc = new CalculatorRuntime(volumeConversion);
    calc.setDisplayText('gallons', '1');
    // mathjs uses slightly different conversion factors than convert-units
    expect(calc.state['litres']).toBeCloseTo(3.785411784, 7);
    expect(calc.state['cubicFeet']).toBeCloseTo(0.133680624455617, 6);
  });
});

describe('Temperature conversion', () => {
  it('converts Celsius into Fahrenheit and kelvin', () => {
    const calc = new CalculatorRuntime(temperatureConversion);
    calc.setDisplayText('celsius', '100');
    expect(calc.state['fahrenheit']).toBeCloseTo(212, 9);
    expect(calc.state['kelvin']).toBeCloseTo(373.15, 9);
  });

  it('converts Fahrenheit into Celsius and kelvin', () => {
    const calc = new CalculatorRuntime(temperatureConversion);
    calc.setDisplayText('fahrenheit', '32');
    expect(calc.state['celsius']).toBeCloseTo(0, 9);
    expect(calc.state['kelvin']).toBeCloseTo(273.15, 9);
  });

  it('refills the group from the most recent edit', () => {
    const calc = new CalculatorRuntime(temperatureConversion);
    calc.setDisplayText('celsius', '100');
    calc.setDisplayText('fahrenheit', '32');
    expect(calc.state['celsius']).toBeCloseTo(0, 9);
    expect(calc.state['kelvin']).toBeCloseTo(273.15, 9);
  });
});

describe('Weight conversion', () => {
  it('converts kilograms into pounds and ounces', () => {
    const calc = new CalculatorRuntime(weightConversion);
    calc.setDisplayText('kilograms', '1');
    expect(calc.state['pounds']).toBeCloseTo(2.2046226218487757, 9);
    expect(calc.state['ounces']).toBeCloseTo(35.27396194958041, 9);
  });
});

describe('Speed conversion', () => {
  it('converts kilometres per hour into the other speeds', () => {
    const calc = new CalculatorRuntime(speedConversion);
    calc.setDisplayText('kilometresPerHour', '100');
    // mathjs uses slightly different conversion factors than convert-units
    expect(calc.state['milesPerHour']).toBeCloseTo(62.13711922373339, 5);
    expect(calc.state['feetPerSecond']).toBeCloseTo(91.13446583066653, 2);
    expect(calc.state['metresPerSecond']).toBeCloseTo(27.77777777777778, 9);
  });
});
