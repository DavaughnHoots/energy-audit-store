// TypeScript test script to verify the implementation of single-family home defaults

import { 
  getSingleFamilyConstructionPeriod, 
  getSingleFamilySizeCategory, 
  getSingleFamilyDefaults 
} from './src/components/audit/forms/housingTypeDefaults';

// Test construction period determination
console.log('Testing construction period determination:');
console.log('Year 1970:', getSingleFamilyConstructionPeriod(1970)); // Should be pre-1980
console.log('Year 1980:', getSingleFamilyConstructionPeriod(1980)); // Should be 1980-2000
console.log('Year 1995:', getSingleFamilyConstructionPeriod(1995)); // Should be 1980-2000
console.log('Year 2000:', getSingleFamilyConstructionPeriod(2000)); // Should be post-2000
console.log('Year 2010:', getSingleFamilyConstructionPeriod(2010)); // Should be post-2000

// Test size category determination
console.log('\nTesting size category determination:');
console.log('1200 sq ft:', getSingleFamilySizeCategory(1200)); // Should be small
console.log('1500 sq ft:', getSingleFamilySizeCategory(1500)); // Should be small
console.log('2000 sq ft:', getSingleFamilySizeCategory(2000)); // Should be medium
console.log('2500 sq ft:', getSingleFamilySizeCategory(2500)); // Should be medium
console.log('3000 sq ft:', getSingleFamilySizeCategory(3000)); // Should be large

// Test default values for different combinations
console.log('\nTesting default values for various combinations:');

// Pre-1980 small home
const pre1980Small = getSingleFamilyDefaults(1970, 1200, 'NY');
console.log('Pre-1980 Small Home (NY):');
console.log('- Construction Period:', getSingleFamilyConstructionPeriod(1970));
console.log('- Size Category:', getSingleFamilySizeCategory(1200));
console.log('- Window Type:', pre1980Small.currentConditions.windowType);
console.log('- Insulation (Attic):', pre1980Small.currentConditions.insulation.attic);
console.log('- Estimated Annual Usage:', pre1980Small.energyConsumption.estimatedAnnualUsage, 'MMBtu/yr');

// 1980-2000 medium home
const mid1990sMedium = getSingleFamilyDefaults(1995, 2000, 'FL');
console.log('\n1980-2000 Medium Home (FL):');
console.log('- Construction Period:', getSingleFamilyConstructionPeriod(1995));
console.log('- Size Category:', getSingleFamilySizeCategory(2000));
console.log('- Window Type:', mid1990sMedium.currentConditions.windowType);
console.log('- Insulation (Attic):', mid1990sMedium.currentConditions.insulation.attic);
console.log('- Estimated Annual Usage:', mid1990sMedium.energyConsumption.estimatedAnnualUsage, 'MMBtu/yr');

// Post-2000 large home
const modern2010Large = getSingleFamilyDefaults(2010, 3500, 'AZ');
console.log('\nPost-2000 Large Home (AZ):');
console.log('- Construction Period:', getSingleFamilyConstructionPeriod(2010));
console.log('- Size Category:', getSingleFamilySizeCategory(3500));
console.log('- Window Type:', modern2010Large.currentConditions.windowType);
console.log('- Insulation (Attic):', modern2010Large.currentConditions.insulation.attic);
console.log('- Estimated Annual Usage:', modern2010Large.energyConsumption.estimatedAnnualUsage, 'MMBtu/yr');

// Compare climate zone adjustments
console.log('\nClimate zone comparisons (same house, different locations):');
const house2000Vermont = getSingleFamilyDefaults(2000, 2000, 'VT'); // Cold climate
const house2000NorthCarolina = getSingleFamilyDefaults(2000, 2000, 'NC'); // Mixed-humid
const house2000Florida = getSingleFamilyDefaults(2000, 2000, 'FL'); // Hot-humid
const house2000Arizona = getSingleFamilyDefaults(2000, 2000, 'AZ'); // Hot-dry

console.log('- Vermont (Cold):', house2000Vermont.energyConsumption.estimatedAnnualUsage, 'MMBtu/yr');
console.log('- North Carolina (Mixed-Humid):', house2000NorthCarolina.energyConsumption.estimatedAnnualUsage, 'MMBtu/yr');
console.log('- Florida (Hot-Humid):', house2000Florida.energyConsumption.estimatedAnnualUsage, 'MMBtu/yr');
console.log('- Arizona (Hot-Dry):', house2000Arizona.energyConsumption.estimatedAnnualUsage, 'MMBtu/yr');
