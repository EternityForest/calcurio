import { create, all } from 'mathjs';
const mathjs = create(all);

// Check what units are available
try {
  const possibilities = mathjs.unit('J').equalsUnit;
  // List all units
  const allUnits = Object.keys(mathjs.Unit._units || {});
  console.log('All units count:', allUnits.length);
  // Check for energy units
  console.log('Has J:', allUnits.includes('J'));
  console.log('Has cal:', allUnits.includes('cal'));
  console.log('Has BTU:', allUnits.includes('BTU'));
  console.log('Has Wh:', allUnits.includes('Wh'));
  // Check for thermal
  console.log('Has W:', allUnits.includes('W'));
  // Search for 'energy' in any unit
  const energyUnits = allUnits.filter(u => u.toLowerCase().includes('j') || u.toLowerCase().includes('cal') || u.toLowerCase().includes('btu'));
  console.log('Energy-like units:', energyUnits);
} catch (e) {
  console.log('Error:', e.message);
}

// Try registering cal and Btu
try {
  mathjs.createUnit('cal', '4.184 J');
  const result = mathjs.unit(1, 'cal/g').to('J/kg');
  console.log('After registering cal: 1 cal/g to J/kg:', result.toNumber());
} catch (e) {
  console.log('Error:', e.message);
}
