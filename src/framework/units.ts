import { create, all, type MathJsStatic } from 'mathjs';

/**
 * Math.js instance configured with Calcurio's unit system.
 * Using 'all' to get full unit support including custom unit creation.
 */
const mathjs: MathJsStatic = create(all!);

/** ASCII-only unit symbols used internally in Calcurio. */
export type UnitSymbol =
  | LengthUnit
  | MassUnit
  | TimeUnit
  | CurrentUnit
  | TemperatureUnit
  | AmountUnit
  | LuminousIntensityUnit
  | FrequencyUnit
  | VoltageUnit
  | PowerUnit
  | EnergyUnit
  | ForceUnit
  | PressureUnit
  | ResistanceUnit
  | ConductanceUnit
  | CapacitanceUnit
  | InductanceUnit
  | MagneticFieldUnit
  | MagneticFluxUnit
  | ResitivityUnit
  | DensityUnit
  | SpecificHeatUnit
  | SpecificEnergyUnit
  | ThermalConductivityUnit
  | DynamicViscosityUnit
  | ThermalExpansionUnit
  | VelocityUnit
  | AccelerationUnit
  | AngleUnit
  | DimensionlessUnit
  | DecibelUnit
  | DeltaTemperatureUnit
  | AreaUnit
  | VolumeUnit
  | FlowRateUnit
  | DataUnit
  | DataRateUnit;

/** Area units. */
export type AreaUnit =
  | 'm^2'
  | 'cm^2'
  | 'mm^2'
  | 'km^2'
  | 'in^2'
  | 'ft^2'
  | 'yd^2'
  | 'mi^2'
  | 'ac'
  | 'ha';

/** Volume units. */
export type VolumeUnit =
  | 'm^3'
  | 'cm^3'
  | 'mm^3'
  | 'l'
  | 'ml'
  | 'gal'
  | 'ft^3'
  | 'in^3'
  | 'yd^3'
  | 'cf';

/** Volumetric flow rate units. */
export type FlowRateUnit =
  | 'm^3/s'
  | 'l/min'
  | 'l/s'
  | 'gal/min'
  | 'gal/s'
  | 'ft^3/s'
  | 'cfm';

/** Length units (meter-based). */
export type LengthUnit =
  | 'm'
  | 'cm'
  | 'mm'
  | 'um'
  | 'nm'
  | 'km'
  | 'in'
  | 'ft'
  | 'yd'
  | 'mi'
  | 'nmi'
  | 'au'
  | 'ly'
  | 'pc';

/** Mass units (kilogram-based). */
export type MassUnit = 'g' | 'kg' | 'mg' | 'ug' | 't' | 'oz' | 'lb' | 'ton';

/** Time units. */
export type TimeUnit = 's' | 'ms' | 'us' | 'ns' | 'min' | 'h' | 'day' | 'week' | 'year';

/** Electrical current units. */
export type CurrentUnit = 'A' | 'mA' | 'uA' | 'nA' | 'kA';

/**
 * Temperature units (absolute). mathjs uses K natively; we keep that symbol.
 */
export type TemperatureUnit = 'degC' | 'degF' | 'K' | 'degR';

/** Delta temperature units for temperature differences/changes. */
export type DeltaTemperatureUnit = 'deltaC' | 'deltaF';

/** Amount of substance units. */
export type AmountUnit = 'mol' | 'mmol' | 'umol';

/** Luminous intensity units. */
export type LuminousIntensityUnit = 'cd' | 'mcd';

/** Frequency units. */
export type FrequencyUnit = 'Hz' | 'kHz' | 'MHz' | 'GHz' | 'rpm';

/** Voltage units. */
export type VoltageUnit = 'V' | 'mV' | 'uV' | 'kV' | 'MV';

/** Power units. */
export type PowerUnit = 'W' | 'mW' | 'kW' | 'MW' | 'GW';

/** Energy units. */
export type EnergyUnit =
  | 'J'
  | 'kJ'
  | 'mJ'
  | 'Wh'
  | 'kWh'
  | 'eV'
  | 'keV'
  | 'MeV'
  | 'cal'
  | 'kcal'
  | 'BTU'
  | 'BTU_IT';

/** Force units. */
export type ForceUnit = 'N' | 'kN' | 'mN' | 'lbf' | 'dyn';

/** Pressure units. */
export type PressureUnit =
  | 'Pa'
  | 'kPa'
  | 'MPa'
  | 'hPa'
  | 'bar'
  | 'mbar'
  | 'atm'
  | 'torr'
  | 'psi'
  | 'ksi';

/** Electrical resistance units (custom - mathjs uses ohm natively but we use ASCII). */
export type ResistanceUnit = 'ohm' | 'mohm' | 'kohm' | 'Mohm' | 'Gohm';

/** Electrical conductance units. */
export type ConductanceUnit = 'S' | 'mS' | 'uS' | 'nS';

/** Capacitance units (custom - mathjs uses farad natively). */
export type CapacitanceUnit = 'F' | 'mF' | 'uF' | 'nF' | 'pF';

/** Inductance units (custom - mathjs uses henry natively). */
export type InductanceUnit = 'H' | 'mH' | 'uH' | 'nH';

/** Magnetic field strength units. */
export type MagneticFieldUnit = 'T' | 'mT' | 'uT' | 'G';

/** Magnetic flux units. */
export type MagneticFluxUnit = 'Wb' | 'mWb' | 'uWb' | 'Mx';

/** Electrical resistivity units. */
export type ResitivityUnit = 'ohm m' | 'ohm cm' | 'ohm mm^2/m' | 'nohm m' | 'uohm cm';

/** Density units. */
export type DensityUnit = 'kg/m^3' | 'g/cm^3' | 'g/mL' | 'kg/L' | 'lb/ft^3';

/** Specific heat capacity units. */
export type SpecificHeatUnit =
  | 'J/(kg K)'
  | 'kJ/(kg K)'
  | 'cal/(g degC)'
  | 'Btu/(lb degF)';

/** Specific energy units. */
export type SpecificEnergyUnit = 'J/kg' | 'kJ/kg' | 'cal/g' | 'Btu/lb';

/** Thermal conductivity units. */
export type ThermalConductivityUnit = 'W/(m K)' | 'Btu/(h ft degF)';

/** Dynamic viscosity units. */
export type DynamicViscosityUnit = 'Pa s' | 'mPa s' | 'cP' | 'P';

/** Thermal expansion coefficient units. */
export type ThermalExpansionUnit = '1/K' | '1/degC' | '1/degF';

/** Velocity units. */
export type VelocityUnit = 'm/s' | 'km/h' | 'mi/h' | 'ft/s' | 'knot';

/** Acceleration units. */
export type AccelerationUnit = 'm/s^2' | 'ft/s^2' | 'g_n';

/** Angle units. */
export type AngleUnit = 'rad' | 'deg' | 'grad' | 'arcmin' | 'arcsec';

/** Dimensionless units (count, percent). */
export type DimensionlessUnit = 'count' | 'percent' | '1';

/** Decibel units (logarithmic - require special conversion handling). */
export type DecibelUnit = 'dB' | 'dBm' | 'dBSPL';

/** Data storage units (bits and bytes). */
export type DataUnit =
  | 'bit'
  | 'byte'
  | 'kb'
  | 'kB'
  | 'Mb'
  | 'MB'
  | 'Gb'
  | 'GB'
  | 'Tb'
  | 'TB'
  | 'Pb'
  | 'PB'
  | 'Eb'
  | 'EB';

/** Data transfer rate units (bits/bytes per second). */
export type DataRateUnit =
  | 'bps'
  | 'kbps'
  | 'Mbps'
  | 'Gbps'
  | 'Tbps'
  | 'Bps'
  | 'kBps'
  | 'MBps'
  | 'GBps'
  | 'TBps';

/** Every measurement kind the unit system understands. */
export type MeasureName =
  | 'length'
  | 'mass'
  | 'time'
  | 'current'
  | 'temperature'
  | 'amount'
  | 'luminous_intensity'
  | 'frequency'
  | 'voltage'
  | 'power'
  | 'energy'
  | 'force'
  | 'pressure'
  | 'resistance'
  | 'conductance'
  | 'capacitance'
  | 'inductance'
  | 'magnetic_field'
  | 'magnetic_flux'
  | 'resistivity'
  | 'density'
  | 'specific_heat'
  | 'specific_energy'
  | 'thermal_conductivity'
  | 'dynamic_viscosity'
  | 'thermal_expansion'
  | 'velocity'
  | 'acceleration'
  | 'angle'
  | 'dimensionless'
  | 'decibel'
  | 'area'
  | 'volume'
  | 'flow_rate'
  | 'delta_temperature'
  | 'data'
  | 'data_rate';

/**
 * Unit to measurement kind mapping for validation and display.
 */
const UNIT_TO_MEASURE: ReadonlyMap<UnitSymbol, MeasureName> = new Map([
  // Length
  ['m', 'length'],
  ['cm', 'length'],
  ['mm', 'length'],
  ['um', 'length'],
  ['nm', 'length'],
  ['km', 'length'],
  ['in', 'length'],
  ['ft', 'length'],
  ['yd', 'length'],
  ['mi', 'length'],
  ['nmi', 'length'],
  ['au', 'length'],
  ['ly', 'length'],
  ['pc', 'length'],
  // Mass
  ['g', 'mass'],
  ['kg', 'mass'],
  ['mg', 'mass'],
  ['ug', 'mass'],
  ['t', 'mass'],
  ['oz', 'mass'],
  ['lb', 'mass'],
  ['ton', 'mass'],
  // Time
  ['s', 'time'],
  ['ms', 'time'],
  ['us', 'time'],
  ['ns', 'time'],
  ['min', 'time'],
  ['h', 'time'],
  ['day', 'time'],
  ['week', 'time'],
  ['year', 'time'],
  // Current
  ['A', 'current'],
  ['mA', 'current'],
  ['uA', 'current'],
  ['nA', 'current'],
  ['kA', 'current'],
  // Temperature (absolute)
  ['degC', 'temperature'],
  ['degF', 'temperature'],
  ['K', 'temperature'],
  ['degR', 'temperature'],
  // Delta temperature
  ['deltaC', 'delta_temperature'],
  ['deltaF', 'delta_temperature'],
  // Amount
  ['mol', 'amount'],
  ['mmol', 'amount'],
  ['umol', 'amount'],
  // Luminous intensity
  ['cd', 'luminous_intensity'],
  ['mcd', 'luminous_intensity'],
  // Frequency
  ['Hz', 'frequency'],
  ['kHz', 'frequency'],
  ['MHz', 'frequency'],
  ['GHz', 'frequency'],
  ['rpm', 'frequency'],
  // Voltage
  ['V', 'voltage'],
  ['mV', 'voltage'],
  ['uV', 'voltage'],
  ['kV', 'voltage'],
  ['MV', 'voltage'],
  // Power
  ['W', 'power'],
  ['mW', 'power'],
  ['kW', 'power'],
  ['MW', 'power'],
  ['GW', 'power'],
  // Energy
  ['J', 'energy'],
  ['kJ', 'energy'],
  ['mJ', 'energy'],
  ['Wh', 'energy'],
  ['kWh', 'energy'],
  ['eV', 'energy'],
  ['keV', 'energy'],
  ['MeV', 'energy'],
  ['cal', 'energy'],
  ['kcal', 'energy'],
  ['BTU', 'energy'],
  ['BTU_IT', 'energy'],
  // Force
  ['N', 'force'],
  ['kN', 'force'],
  ['mN', 'force'],
  ['lbf', 'force'],
  ['dyn', 'force'],
  // Pressure
  ['Pa', 'pressure'],
  ['kPa', 'pressure'],
  ['MPa', 'pressure'],
  ['hPa', 'pressure'],
  ['bar', 'pressure'],
  ['mbar', 'pressure'],
  ['atm', 'pressure'],
  ['torr', 'pressure'],
  ['psi', 'pressure'],
  ['ksi', 'pressure'],
  // Resistance
  ['ohm', 'resistance'],
  ['mohm', 'resistance'],
  ['kohm', 'resistance'],
  ['Mohm', 'resistance'],
  ['Gohm', 'resistance'],
  // Conductance
  ['S', 'conductance'],
  ['mS', 'conductance'],
  ['uS', 'conductance'],
  ['nS', 'conductance'],
  // Capacitance
  ['F', 'capacitance'],
  ['mF', 'capacitance'],
  ['uF', 'capacitance'],
  ['nF', 'capacitance'],
  ['pF', 'capacitance'],
  // Inductance
  ['H', 'inductance'],
  ['mH', 'inductance'],
  ['uH', 'inductance'],
  ['nH', 'inductance'],
  // Magnetic field
  ['T', 'magnetic_field'],
  ['mT', 'magnetic_field'],
  ['uT', 'magnetic_field'],
  ['G', 'magnetic_field'],
  // Magnetic flux
  ['Wb', 'magnetic_flux'],
  ['mWb', 'magnetic_flux'],
  ['uWb', 'magnetic_flux'],
  ['Mx', 'magnetic_flux'],
  // Resistivity
  ['ohm m', 'resistivity'],
  ['ohm cm', 'resistivity'],
  ['ohm mm^2/m', 'resistivity'],
  ['nohm m', 'resistivity'],
  ['uohm cm', 'resistivity'],
  // Density
  ['kg/m^3', 'density'],
  ['g/cm^3', 'density'],
  ['g/mL', 'density'],
  ['kg/L', 'density'],
  ['lb/ft^3', 'density'],
  // Specific heat
  ['J/(kg K)', 'specific_heat'],
  ['kJ/(kg K)', 'specific_heat'],
  ['cal/(g degC)', 'specific_heat'],
  ['Btu/(lb degF)', 'specific_heat'],
  // Specific energy
  ['J/kg', 'specific_energy'],
  ['kJ/kg', 'specific_energy'],
  ['cal/g', 'specific_energy'],
  ['Btu/lb', 'specific_energy'],
  // Thermal conductivity
  ['W/(m K)', 'thermal_conductivity'],
  ['Btu/(h ft degF)', 'thermal_conductivity'],
  // Dynamic viscosity
  ['Pa s', 'dynamic_viscosity'],
  ['mPa s', 'dynamic_viscosity'],
  ['cP', 'dynamic_viscosity'],
  ['P', 'dynamic_viscosity'],
  // Thermal expansion
  ['1/K', 'thermal_expansion'],
  ['1/degC', 'thermal_expansion'],
  ['1/degF', 'thermal_expansion'],
  // Velocity
  ['m/s', 'velocity'],
  ['km/h', 'velocity'],
  ['mi/h', 'velocity'],
  ['ft/s', 'velocity'],
  ['knot', 'velocity'],
  // Acceleration
  ['m/s^2', 'acceleration'],
  ['ft/s^2', 'acceleration'],
  ['g_n', 'acceleration'],
  // Angle
  ['rad', 'angle'],
  ['deg', 'angle'],
  ['grad', 'angle'],
  ['arcmin', 'angle'],
  ['arcsec', 'angle'],
  // Dimensionless
  ['count', 'dimensionless'],
  ['percent', 'dimensionless'],
  ['1', 'dimensionless'],
  // Decibel
  ['dB', 'decibel'],
  ['dBm', 'decibel'],
  ['dBSPL', 'decibel'],
  // Data
  ['bit', 'data'],
  ['byte', 'data'],
  ['kb', 'data'],
  ['kB', 'data'],
  ['Mb', 'data'],
  ['MB', 'data'],
  ['Gb', 'data'],
  ['GB', 'data'],
  ['Tb', 'data'],
  ['TB', 'data'],
  ['Pb', 'data'],
  ['PB', 'data'],
  ['Eb', 'data'],
  ['EB', 'data'],
  // Data rate
  ['bps', 'data_rate'],
  ['kbps', 'data_rate'],
  ['Mbps', 'data_rate'],
  ['Gbps', 'data_rate'],
  ['Tbps', 'data_rate'],
  ['Bps', 'data_rate'],
  ['kBps', 'data_rate'],
  ['MBps', 'data_rate'],
  ['GBps', 'data_rate'],
  ['TBps', 'data_rate'],
  // Area
  ['m^2', 'area'],
  ['cm^2', 'area'],
  ['mm^2', 'area'],
  ['km^2', 'area'],
  ['in^2', 'area'],
  ['ft^2', 'area'],
  ['yd^2', 'area'],
  ['mi^2', 'area'],
  ['ac', 'area'],
  ['ha', 'area'],
  // Volume
  ['m^3', 'volume'],
  ['cm^3', 'volume'],
  ['mm^3', 'volume'],
  ['l', 'volume'],
  ['ml', 'volume'],
  ['gal', 'volume'],
  ['ft^3', 'volume'],
  ['in^3', 'volume'],
  ['yd^3', 'volume'],
  ['cf', 'volume'],
  // Flow rate
  ['m^3/s', 'flow_rate'],
  ['l/min', 'flow_rate'],
  ['l/s', 'flow_rate'],
  ['gal/min', 'flow_rate'],
  ['gal/s', 'flow_rate'],
  ['ft^3/s', 'flow_rate'],
  ['cfm', 'flow_rate'],
]);

/** Units that share the same base (can be converted between). */
const MEASURE_UNITS: ReadonlyMap<MeasureName, readonly UnitSymbol[]> = new Map([
  ['length', ['m', 'cm', 'mm', 'um', 'nm', 'km', 'in', 'ft', 'yd', 'mi', 'nmi', 'au', 'ly', 'pc']],
  ['mass', ['kg', 'g', 'mg', 'ug', 't', 'oz', 'lb', 'ton']],
  ['time', ['s', 'ms', 'us', 'ns', 'min', 'h', 'day', 'week', 'year']],
  ['current', ['A', 'mA', 'uA', 'nA', 'kA']],
  ['temperature', ['degC', 'degF', 'K', 'degR']],
  ['delta_temperature', ['deltaC', 'deltaF']],
  ['amount', ['mol', 'mmol', 'umol']],
  ['luminous_intensity', ['cd', 'mcd']],
  ['frequency', ['Hz', 'kHz', 'MHz', 'GHz', 'rpm']],
  ['voltage', ['V', 'mV', 'uV', 'kV', 'MV']],
  ['power', ['W', 'mW', 'kW', 'MW', 'GW']],
  ['energy', ['J', 'kJ', 'mJ', 'Wh', 'kWh', 'eV', 'keV', 'MeV', 'cal', 'kcal', 'BTU', 'BTU_IT']],
  ['force', ['N', 'kN', 'mN', 'lbf', 'dyn']],
  ['pressure', ['Pa', 'kPa', 'MPa', 'hPa', 'bar', 'mbar', 'atm', 'torr', 'psi', 'ksi']],
  ['resistance', ['ohm', 'mohm', 'kohm', 'Mohm', 'Gohm']],
  ['conductance', ['S', 'mS', 'uS', 'nS']],
  ['capacitance', ['F', 'mF', 'uF', 'nF', 'pF']],
  ['inductance', ['H', 'mH', 'uH', 'nH']],
  ['magnetic_field', ['T', 'mT', 'uT', 'G']],
  ['magnetic_flux', ['Wb', 'mWb', 'uWb', 'Mx']],
  ['resistivity', ['ohm m', 'ohm cm', 'ohm mm^2/m', 'nohm m', 'uohm cm']],
  ['density', ['kg/m^3', 'g/cm^3', 'g/mL', 'kg/L', 'lb/ft^3']],
  ['specific_heat', ['J/(kg K)', 'kJ/(kg K)', 'cal/(g degC)', 'Btu/(lb degF)']],
  ['specific_energy', ['J/kg', 'kJ/kg', 'cal/g', 'Btu/lb']],
  ['thermal_conductivity', ['W/(m K)', 'Btu/(h ft degF)']],
  ['dynamic_viscosity', ['Pa s', 'mPa s', 'cP', 'P']],
  ['thermal_expansion', ['1/K', '1/degC', '1/degF']],
  ['velocity', ['m/s', 'km/h', 'mi/h', 'ft/s', 'knot']],
  ['acceleration', ['m/s^2', 'ft/s^2', 'g_n']],
  ['angle', ['rad', 'deg', 'grad', 'arcmin', 'arcsec']],
  ['dimensionless', ['count', 'percent', '1']],
  ['decibel', ['dB', 'dBm', 'dBSPL']],
  ['area', ['m^2', 'cm^2', 'mm^2', 'km^2', 'in^2', 'ft^2', 'yd^2', 'mi^2', 'ac', 'ha']],
  ['volume', ['m^3', 'cm^3', 'mm^3', 'l', 'ml', 'gal', 'ft^3', 'in^3', 'yd^3', 'cf']],
  ['flow_rate', ['m^3/s', 'l/min', 'l/s', 'gal/min', 'gal/s', 'ft^3/s', 'cfm']],
  ['data', ['bit', 'byte', 'kb', 'kB', 'Mb', 'MB', 'Gb', 'GB', 'Tb', 'TB', 'Pb', 'PB', 'Eb', 'EB']],
  ['data_rate', ['bps', 'kbps', 'Mbps', 'Gbps', 'Tbps', 'Bps', 'kBps', 'MBps', 'GBps', 'TBps']],
]);

// ============================================================================
// Mathjs configuration: add custom units and define delta temperature
// ============================================================================

// Custom units that mathjs doesn't have natively or uses different names for
const CUSTOM_UNITS: Record<string, { definition: string; offset?: number }> = {
  // Resistance (mathjs uses 'ohm' already)
  mohm: { definition: '0.001 ohm' },
  kohm: { definition: '1000 ohm' },
  Mohm: { definition: '1000000 ohm' },
  Gohm: { definition: '1000000000 ohm' },
  // Capacitance (mathjs has F natively)
  mF: { definition: '0.001 F' },
  uF: { definition: '0.000001 F' },
  nF: { definition: '0.000000001 F' },
  pF: { definition: '0.000000000001 F' },
  // Inductance (mathjs has H natively)
  mH: { definition: '0.001 H' },
  uH: { definition: '0.000001 H' },
  nH: { definition: '0.000000001 H' },
  // Resistivity
  ohm_m: { definition: 'ohm m' },
  ohm_cm: { definition: '0.01 ohm m' },
  ohm_mm2_m: { definition: '1e-6 ohm m' },
  nohm_m: { definition: '1e-9 ohm m' },
  uohm_cm: { definition: '1e-8 ohm m' },
  // Density
  kg_m3: { definition: 'kg/m^3' },
  g_cm3: { definition: '1000 kg/m^3' },
  g_mL: { definition: '1000 kg/m^3' },
  kg_L: { definition: '1000 kg/m^3' },
  lb_ft3: { definition: '16.01846337396 kg/m^3' },
  // Specific heat
  J_kgK: { definition: 'J/(kg K)' },
  kJ_kgK: { definition: '1000 J/(kg K)' },
  cal_gC: { definition: '4184 J/(kg K)' },
  Btu_lbF: { definition: '4186.8 J/(kg K)' },
  // Energy units that mathjs doesn't have natively
  cal: { definition: '4.184 J' },
  kcal: { definition: '4184 J' },
  BTU: { definition: '1055.05585262 J' },
  BTU_IT: { definition: '1055.05585262 J' },
  Btu: { definition: '1055.05585262 J' },
  // Specific energy (per mass) units - need explicit registration
  'J/kg': { definition: 'J/kg' },
  'kJ/kg': { definition: 'kJ/kg' },
  'cal/g': { definition: 'cal/g' },
  'Btu/lb': { definition: 'Btu/lb' },
  // Thermal conductivity
  W_mK: { definition: 'W/(m K)' },
  Btu_hftF: { definition: '1.730735 W/(m K)' },
  // Dynamic viscosity
  Pa_s: { definition: 'Pa s' },
  mPa_s: { definition: '0.001 Pa s' },
  cP: { definition: '0.001 Pa s' },
  P: { definition: '0.1 Pa s' },
  // Thermal expansion (dimensionless)
  '1/K': { definition: '1/K' },
  '1/degC': { definition: '1/degC' },
  '1/degF': { definition: '1/degF' },
  // Velocity
  m_s: { definition: 'm/s' },
  km_h: { definition: '1000/3600 m/s' },
  mi_h: { definition: '0.44704 m/s' },
  ft_s: { definition: '0.3048 m/s' },
  knot: { definition: '0.514444 m/s' },
  // Acceleration
  m_s2: { definition: 'm/s^2' },
  ft_s2: { definition: '0.3048 m/s^2' },
  g_n: { definition: '9.80665 m/s^2' },
  // Temperature uses mathjs native units (degC, degF, K, degR)
  // Delta temperature (same as Kelvin/degree, no offset)
  // deltaC = 1 deltaC = 1 degC = 1 K (dimensionally equivalent, but for temperature changes)
  deltaC: { definition: '1 K' }, // Identical to Kelvin for arithmetic
  deltaF: { definition: '5/9 K' }, // Identical to Rankine for arithmetic
  // Dimensionless
  count: { definition: '1' },
  percent: { definition: '0.01' },
  // Area
  m2: { definition: 'm^2' },
  cm2: { definition: 'cm^2' },
  mm2: { definition: 'mm^2' },
  km2: { definition: 'km^2' },
  in2: { definition: 'in^2' },
  ft2: { definition: 'ft^2' },
  yd2: { definition: 'yd^2' },
  mi2: { definition: 'mi^2' },
  ac: { definition: '4046.8564224 m^2' },
  ha: { definition: '10000 m^2' },
  // Volume
  m3: { definition: 'm^3' },
  cm3: { definition: 'cm^3' },
  mm3: { definition: 'mm^3' },
  l: { definition: '0.001 m^3' },
  ml: { definition: '0.000001 m^3' },
  gal: { definition: '0.003785411784 m^3' },
  ft3: { definition: 'ft^3' },
  in3: { definition: 'in^3' },
  yd3: { definition: 'yd^3' },
  cf: { definition: 'ft^3' },
  // Flow rate
  m3_s: { definition: 'm^3/s' },
  l_min: { definition: '0.001 m^3/min' },
  l_s: { definition: '0.001 m^3/s' },
  gal_min: { definition: '0.003785411784 m^3/min' },
  gal_s: { definition: '0.003785411784 m^3/s' },
  ft3_s: { definition: 'ft^3/s' },
  cfm: { definition: 'ft^3/min' },
  // Data storage (bits and bytes - using bit as base)
  bit: { definition: 'bit' },
  byte: { definition: '8 bit' },
  kb: { definition: '1000 bit' },
  kB: { definition: '8000 bit' },
  Mb: { definition: '1000000 bit' },
  MB: { definition: '8000000 bit' },
  Gb: { definition: '1000000000 bit' },
  GB: { definition: '8000000000 bit' },
  Tb: { definition: '1000000000000 bit' },
  TB: { definition: '8000000000000 bit' },
  Pb: { definition: '1000000000000000 bit' },
  PB: { definition: '8000000000000000 bit' },
  Eb: { definition: '1000000000000000000 bit' },
  EB: { definition: '8000000000000000000 bit' },
  // Data rate (use 1/s as base to avoid mathjs bug with bit/s and byte/s)
  bps: { definition: '1/s' },
  kbps: { definition: '1000 bps' },
  Mbps: { definition: '1000000 bps' },
  Gbps: { definition: '1000000000 bps' },
  Tbps: { definition: '1000000000000 bps' },
  Bps: { definition: '8 bps' },
  kBps: { definition: '8000 bps' },
  MBps: { definition: '8000000 bps' },
  GBps: { definition: '8000000000 bps' },
  TBps: { definition: '8000000000000 bps' },
  // Parts per notation (will be handled specially in conversion)
  ppm: { definition: '1e-6' },
  ppb: { definition: '1e-9' },
  ppt: { definition: '1e-12' },
  // Decibel variants (defined but will be isolated in conversion)
  dBm: { definition: '1 dBm' },
  dBSPL: { definition: '1 dBSPL' },
};

// Register custom units with mathjs
for (const [name, config] of Object.entries(CUSTOM_UNITS)) {
  try {
    if (config.offset !== undefined) {
      mathjs.createUnit(name, config.definition, { offset: config.offset });
    } else {
      mathjs.createUnit(name, config.definition);
    }
  } catch {
    // Unit may already exist, ignore
  }
}

// ============================================================================
// Conversion functions
// ============================================================================

/**
 * Units that require special conversion handling. These are ratio-based or
 * logarithmic units where the standard linear conversion doesn't apply.
 */
const SPECIAL_CONVERSION_UNITS: ReadonlySet<string> = new Set([
  'percent',
  'ppm',
  'ppb',
  'ppt',
  'dB',
  'dBm',
  'dBSPL',
]);

/**
 * Returns true if the unit requires special conversion handling.
 * These units should not use standard mathjs conversion.
 */
export function isSpecialConversionUnit(unit: string): boolean {
  return SPECIAL_CONVERSION_UNITS.has(unit);
}

/**
 * Converts a value through special ratio units (percent, ppm, ppb, ppt).
 * Returns null if no special handling applies.
 *
 * For percent: 50% -> 0.5, 0.5 -> 50%
 * For ppm/ppb/ppt: converts to/from the base ratio value
 */
function convertSpecialRatio(
  value: number,
  from: UnitSymbol,
  to: UnitSymbol,
): number | null {
  const multipliers: Record<string, number> = {
    percent: 0.01,
    ppm: 1e-6,
    ppb: 1e-9,
    ppt: 1e-12,
  };

  const fromMultiplier = multipliers[from];
  const toMultiplier = multipliers[to];

  // Both are ratio units - convert between them
  if (fromMultiplier !== undefined && toMultiplier !== undefined) {
    // First convert to base (ratio), then to target
    const baseValue = value * fromMultiplier;
    return baseValue / toMultiplier;
  }

  // From ratio unit to dimensionless - convert to base ratio
  if (fromMultiplier !== undefined && toMultiplier === undefined && (to === '1' || to === 'count')) {
    return value * fromMultiplier;
  }

  // From dimensionless to ratio unit - convert from base ratio
  if (fromMultiplier === undefined && toMultiplier !== undefined && (from === '1' || from === 'count')) {
    return value / toMultiplier;
  }

  return null;
}

/**
 * Converts a value between two units of the same kind.
 * Throws if units are incompatible.
 * Handles special units (percent, ppm, ppb, ppt, dB, dBm, dBSPL) specially.
 */
export function convertUnit(
  value: number,
  from: UnitSymbol,
  to: UnitSymbol,
): number {
  // Handle special ratio conversions (percent, ppm, ppb, ppt)
  const specialResult = convertSpecialRatio(value, from, to);
  if (specialResult !== null) {
    return specialResult;
  }

  // Handle decibel units - these should error as they require logarithmic conversion
  // which math.js can't do properly. Check both from and to for any dB unit.
  const fromIsDecibel = from === 'dB' || from === 'dBm' || from === 'dBSPL';
  const toIsDecibel = to === 'dB' || to === 'dBm' || to === 'dBSPL';

  // If both are the same decibel unit, allow it (pass through)
  if (fromIsDecibel && toIsDecibel && from === to) {
    return value;
  }

  // If either unit is a different decibel unit, we can't convert it properly
  if (fromIsDecibel || toIsDecibel) {
    // Try mathjs anyway - it should fail for these since they're not properly defined
    try {
      const result = mathjs.unit(value, from).to(to);
      return result.toNumber() as number;
    } catch {
      // This is expected - decibel conversions require special handling
      throw new Error(
        `Cannot convert ${value} ${from} to ${to}: decibel units require special conversion handling`,
      );
    }
  }

  // Dimensionless '1' and 'count' pass through unchanged
  if (isDimensionless(from) || isDimensionless(to)) {
    return value;
  }

  try {
    const result = mathjs.unit(value, from).to(to);
    return result.toNumber() as number;
  } catch {
    const fromMeasure = measureOf(from);
    const toMeasure = measureOf(to);
    throw new Error(
      `Cannot convert ${value} ${from} to ${to}: incompatible units (${fromMeasure} vs ${toMeasure})`,
    );
  }
}

/**
 * Returns true if the unit is the special "1" (dimensionless) unit.
 */
export function isDimensionless(unit: UnitSymbol): boolean {
  return unit === '1' || unit === 'count' || unit === 'percent';
}

/**
 * Returns the measurement kind for a unit, such as "length" or "resistance".
 */
export function measureOf(unit: UnitSymbol): MeasureName {
  const measure = UNIT_TO_MEASURE.get(unit);
  if (measure === undefined) {
    throw new Error(`Unknown unit: ${unit}`);
  }
  return measure;
}

/**
 * Lists every unit of the same kind as the given unit.
 */
export function unitsOfKind(unit: UnitSymbol): readonly UnitSymbol[] {
  const measure = measureOf(unit);
  return MEASURE_UNITS.get(measure) ?? [];
}

/**
 * Every unit the framework knows, grouped by measurement kind.
 */
export function unitsByMeasure(): ReadonlyMap<MeasureName, readonly UnitSymbol[]> {
  return MEASURE_UNITS;
}

/**
 * All measurement kinds that can be selected in a calculator config.
 * Excludes delta_temperature since it's special-purpose for add/subtract.
 */
export function measurementKinds(): readonly MeasureName[] {
  return [
    'length',
    'mass',
    'time',
    'current',
    'temperature',
    'amount',
    'luminous_intensity',
    'frequency',
    'voltage',
    'power',
    'energy',
    'force',
    'pressure',
    'resistance',
    'conductance',
    'capacitance',
    'inductance',
    'magnetic_field',
    'magnetic_flux',
    'resistivity',
    'density',
    'specific_heat',
    'specific_energy',
    'thermal_conductivity',
    'dynamic_viscosity',
    'thermal_expansion',
    'velocity',
    'acceleration',
    'angle',
    'dimensionless',
    'decibel',
    'area',
    'volume',
    'flow_rate',
    'data',
    'data_rate',
  ];
}

/**
 * Validates that a string is a known unit symbol.
 */
export function isUnitSymbol(value: string): value is UnitSymbol {
  return UNIT_TO_MEASURE.has(value as UnitSymbol);
}

/**
 * Gets the default base unit for a measurement kind.
 */
export function baseUnitForMeasure(measure: MeasureName): UnitSymbol {
  const units = MEASURE_UNITS.get(measure);
  if (units === undefined || units.length === 0) {
    throw new Error(`No units found for measure: ${measure}`);
  }
  // First unit in the list is typically the SI base
  return units[0]!;
}

/**
 * Choices for the unit selector in calculator config.
 * Returns the base unit plus all other units of the same kind.
 * If `options` is provided, only those units are included (plus the base).
 */
export function choicesForUnit(
  unit: UnitSymbol,
  options?: readonly UnitSymbol[],
): UnitSymbol[] {
  const candidates = options ?? unitsOfKind(unit);
  const choices: UnitSymbol[] = [];
  // Always put the given unit first
  if (!choices.includes(unit)) {
    choices.push(unit);
  }
  // Then add all other candidates (avoiding duplicates)
  for (const candidate of candidates) {
    if (!choices.includes(candidate)) {
      choices.push(candidate);
    }
  }
  return choices;
}

/**
 * Gets the default unit for a measurement kind selection.
 * For temperature, returns degC; for most others, returns the base SI unit.
 */
export function defaultUnitForMeasure(measure: MeasureName): UnitSymbol {
  switch (measure) {
    case 'temperature':
      return 'degC';
    case 'delta_temperature':
      return 'deltaC';
    case 'dimensionless':
      return '1';
    default:
      return baseUnitForMeasure(measure);
  }
}

// ============================================================================
// Unicode display mapping for UI
// ============================================================================

/**
 * Maps ASCII units to their Unicode display equivalents for UI presentation.
 */
export const ASCII_TO_UNICODE: ReadonlyMap<string, string> = new Map([
  // Temperature
  ['degC', '°C'],
  ['degF', '°F'],
  ['K', 'K'],
  ['degR', '°R'],
  // Delta temperature
  ['deltaC', 'Δ°C'],
  ['deltaF', 'Δ°F'],
  // Resistance
  ['ohm', 'Ω'],
  ['mohm', 'mohm'],
  ['kohm', 'kΩ'],
  ['Mohm', 'MΩ'],
  ['Gohm', 'GΩ'],
  // Capacitance
  ['uF', 'µF'],
  ['nF', 'nF'],
  ['pF', 'pF'],
  // Inductance
  ['uH', 'µH'],
  ['nH', 'nH'],
  // Current
  ['uA', 'µA'],
  // Length
  ['um', 'µm'],
  ['nm', 'nm'],
  // Resistivity
  ['ohm m', 'Ω·m'],
  ['ohm cm', 'Ω·cm'],
  ['ohm mm^2/m', 'Ω·mm²/m'],
  ['nohm m', 'nΩ·m'],
  ['uohm cm', 'µΩ·cm'],
  // Density
  ['kg/m^3', 'kg/m³'],
  ['g/cm^3', 'g/cm³'],
  ['g/mL', 'g/mL'],
  ['kg/L', 'kg/L'],
  ['lb/ft^3', 'lb/ft³'],
  // Specific heat
  ['J/(kg K)', 'J/(kg·K)'],
  ['kJ/(kg K)', 'kJ/(kg·K)'],
  ['cal/(g degC)', 'cal/(g·°C)'],
  ['Btu/(lb degF)', 'Btu/(lb·°F)'],
  // Specific energy
  ['J/kg', 'J/kg'],
  ['kJ/kg', 'kJ/kg'],
  ['cal/g', 'cal/g'],
  ['Btu/lb', 'Btu/lb'],
  // Thermal conductivity
  ['W/(m K)', 'W/(m·K)'],
  ['Btu/(h ft degF)', 'Btu/(h·ft·°F)'],
  // Dynamic viscosity
  ['Pa s', 'Pa·s'],
  ['mPa s', 'mPa·s'],
  ['cP', 'cP'],
  ['P', 'P'],
  // Velocity
  ['m/s', 'm/s'],
  ['km/h', 'km/h'],
  ['mi/h', 'mi/h'],
  ['ft/s', 'ft/s'],
  ['knot', 'knot'],
  // Acceleration
  ['m/s^2', 'm/s²'],
  ['ft/s^2', 'ft/s²'],
  ['g_n', 'g'],
  // Time
  ['us', 'µs'],
  ['ns', 'ns'],
  // Thermal expansion
  ['1/K', '1/K'],
  ['1/degC', '1/°C'],
  ['1/degF', '1/°F'],
  // Energy
  ['Wh', 'Wh'],
  ['kWh', 'kWh'],
  ['BTU_IT', 'BTU'],
  // Misc
  ['arcmin', '′'],
  ['arcsec', '″'],
  // Area
  ['m^2', 'm²'],
  ['cm^2', 'cm²'],
  ['mm^2', 'mm²'],
  ['km^2', 'km²'],
  ['in^2', 'in²'],
  ['ft^2', 'ft²'],
  ['yd^2', 'yd²'],
  ['mi^2', 'mi²'],
  // Volume
  ['m^3', 'm³'],
  ['cm^3', 'cm³'],
  ['mm^3', 'mm³'],
  ['l', 'L'],
  ['ml', 'mL'],
  ['ft^3', 'ft³'],
  ['in^3', 'in³'],
  ['yd^3', 'yd³'],
  // Flow rate
  ['m^3/s', 'm³/s'],
  ['l/min', 'L/min'],
  ['l/s', 'L/s'],
  ['gal/min', 'gal/min'],
  ['gal/s', 'gal/s'],
  ['ft^3/s', 'ft³/s'],
  ['cfm', 'CFM'],
]);

// Composite units use '@' to separate value unit from axis units.
// e.g., 'kg_m3@degC' represents kg/m³ values indexed by °C.
export interface UnitDescription {
  readonly unit: UnitSymbol;
  readonly measure: MeasureName;
}

/** Returns unit details, or null when the abbreviation is unknown. */
export function tryDescribeUnit(value: string): UnitDescription | null {
  try {
    if (!isUnitSymbol(value)) {
      return null;
    }
    return {
      unit: value,
      measure: measureOf(value),
    };
  } catch {
    return null;
  }
}

/**
 * Splits a composite unit such as `kg_m3@degC` or `kg_m3@degC,kPa` into the
 * value unit and the axis units. Returns null when the value unit or any axis
 * unit is not a known unit.
 */
export function parseCompositeUnit(
  unit: string,
): { readonly unit: UnitSymbol; readonly axes: readonly UnitSymbol[] } | null {
  const at = unit.indexOf('@');
  if (at <= 0 || at === unit.length - 1) {
    return null;
  }
  const valueUnit = unit.slice(0, at);
  if (!isUnitSymbol(valueUnit)) {
    return null;
  }
  const axes: UnitSymbol[] = [];
  for (const part of unit.slice(at + 1).split(',')) {
    const axisUnit = part.trim();
    if (!isUnitSymbol(axisUnit)) {
      return null;
    }
    axes.push(axisUnit);
  }
  if (axes.length === 0) {
    return null;
  }
  return { unit: valueUnit, axes };
}

/** Joins a value unit and one or more axis units into a composite unit. */
export function compositeUnit(
  value: UnitSymbol,
  ...axes: readonly UnitSymbol[]
): string {
  return `${value}@${axes.join(',')}`;
}

/**
 * Converts an ASCII unit to its Unicode display form for UI.
 */
export function toUnicodeDisplay(unit: string): string {
  return ASCII_TO_UNICODE.get(unit) ?? unit;
}

/**
 * Converts a Unicode display unit back to ASCII for storage.
 */
export function fromUnicodeDisplay(display: string): string {
  // Build reverse map on first use
  const UNICODE_TO_ASCII: Map<string, string> = new Map();
  ASCII_TO_UNICODE.forEach((unicode, ascii) => {
    UNICODE_TO_ASCII.set(unicode, ascii);
  });
  return UNICODE_TO_ASCII.get(display) ?? display;
}

/**
 * Checks if two units are compatible for conversion (same measurement kind).
 */
export function areUnitsCompatible(a: UnitSymbol, b: UnitSymbol): boolean {
  try {
    return measureOf(a) === measureOf(b);
  } catch {
    return false;
  }
}