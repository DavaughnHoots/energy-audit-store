// Test script for Lighting Data Normalization improvements

/**
 * This script tests the improvements made to normalize lighting data
 * and provide consistent, accurate lighting information in audit reports
 */

const fs = require('fs');
const path = require('path');

// Mock audit data for testing
const mockAuditData = {
  basicInfo: {
    address: '123 Energy St',
    propertyType: 'single-family',
    yearBuilt: 2000
  },
  homeDetails: {
    squareFootage: 2500
  },
  currentConditions: {
    primaryBulbType: 'Mix of Bulb Types',
    bulbPercentages: {
      led: 0,
      cfl: 0,
      incandescent: 0
    }
  }
};

/**
 * Test default bulb percentages based on property age
 */
function testDefaultBulbPercentages() {
  console.log('\n--- Testing Default Bulb Percentages ---');
  
  // Implementation from lighting_data_normalization_implementation.js
  const getDefaultBulbPercentages = (yearBuilt) => {
    try {
      // If year is provided, estimate based on construction date
      if (yearBuilt && !isNaN(yearBuilt)) {
        if (yearBuilt >= 2020) {
          // Most modern homes use LED lighting
          return { led: 70, cfl: 20, incandescent: 10 };
        } else if (yearBuilt >= 2010) {
          // Transition period with mix of LED and CFL
          return { led: 40, cfl: 40, incandescent: 20 };
        } else if (yearBuilt >= 2000) {
          // CFL adoption period
          return { led: 20, cfl: 50, incandescent: 30 };
        } else if (yearBuilt >= 1980) {
          // Older homes with more incandescent
          return { led: 10, cfl: 30, incandescent: 60 };
        } else {
          // Very old homes, likely higher incandescent usage
          return { led: 5, cfl: 15, incandescent: 80 };
        }
      }
      
      // Default for unknown construction date - conservative estimate
      return { led: 30, cfl: 30, incandescent: 40 };
    } catch (error) {
      console.error('Error calculating default bulb percentages', error);
      // Fallback defaults
      return { led: 30, cfl: 30, incandescent: 40 };
    }
  };
  
  // Test with different years
  const years = [2023, 2015, 2005, 1995, 1975, null];
  
  years.forEach(year => {
    const percentages = getDefaultBulbPercentages(year);
    console.log(`Year ${year || 'unknown'}: LED: ${percentages.led}%, CFL: ${percentages.cfl}%, Incandescent: ${percentages.incandescent}%`);
    console.log(`Total: ${percentages.led + percentages.cfl + percentages.incandescent}%`);
    console.assert(percentages.led + percentages.cfl + percentages.incandescent === 100, 'Percentages should sum to 100%');
  });
}

/**
 * Test bulb percentage normalization
 */
function testNormalizeBulbPercentages() {
  console.log('\n--- Testing Bulb Percentage Normalization ---');
  
  // Mock the getDefaultBulbPercentages method
  const getDefaultBulbPercentages = () => {
    return { led: 30, cfl: 30, incandescent: 40 };
  };
  
  // Implementation from lighting_data_normalization_implementation.js
  const normalizeBulbPercentages = (percentages) => {
    try {
      // Handle null/undefined input
      if (!percentages) {
        console.warn('No bulb percentages provided for normalization');
        return getDefaultBulbPercentages();
      }
      
      // Ensure values are numbers and not undefined
      const led = typeof percentages.led === 'number' && !isNaN(percentages.led) ? percentages.led : 0;
      const cfl = typeof percentages.cfl === 'number' && !isNaN(percentages.cfl) ? percentages.cfl : 0;
      const incandescent = typeof percentages.incandescent === 'number' && !isNaN(percentages.incandescent) ? percentages.incandescent : 0;
      
      // Calculate sum
      const total = led + cfl + incandescent;
      
      // If no data available, use defaults
      if (total === 0) {
        console.debug('No bulb data available, using defaults');
        return getDefaultBulbPercentages();
      }
      
      // Normalize to 100%
      return {
        led: Math.round((led / total) * 100),
        cfl: Math.round((cfl / total) * 100),
        incandescent: Math.round((incandescent / total) * 100)
      };
    } catch (error) {
      console.error('Error normalizing bulb percentages', error);
      return getDefaultBulbPercentages();
    }
  };
  
  // Test Case 1: Normal data that needs normalization
  const testCase1 = { led: 10, cfl: 15, incandescent: 25 };
  const normalized1 = normalizeBulbPercentages(testCase1);
  console.log('Test Case 1: Non-normalized data');
  console.log(`Input: LED: ${testCase1.led}, CFL: ${testCase1.cfl}, Incandescent: ${testCase1.incandescent}`);
  console.log(`Output: LED: ${normalized1.led}%, CFL: ${normalized1.cfl}%, Incandescent: ${normalized1.incandescent}%`);
  console.log(`Total: ${normalized1.led + normalized1.cfl + normalized1.incandescent}%`);
  
  // Test Case 2: All zeros (should use defaults)
  const testCase2 = { led: 0, cfl: 0, incandescent: 0 };
  const normalized2 = normalizeBulbPercentages(testCase2);
  console.log('\nTest Case 2: All zeros');
  console.log(`Input: LED: ${testCase2.led}, CFL: ${testCase2.cfl}, Incandescent: ${testCase2.incandescent}`);
  console.log(`Output: LED: ${normalized2.led}%, CFL: ${normalized2.cfl}%, Incandescent: ${normalized2.incandescent}%`);
  console.log(`Total: ${normalized2.led + normalized2.cfl + normalized2.incandescent}%`);
  
  // Test Case 3: Missing properties
  const testCase3 = { led: 50 };
  const normalized3 = normalizeBulbPercentages(testCase3);
  console.log('\nTest Case 3: Missing properties');
  console.log(`Input: LED: ${testCase3.led}, CFL: undefined, Incandescent: undefined`);
  console.log(`Output: LED: ${normalized3.led}%, CFL: ${normalized3.cfl}%, Incandescent: ${normalized3.incandescent}%`);
  console.log(`Total: ${normalized3.led + normalized3.cfl + normalized3.incandescent}%`);
  
  // Test Case 4: null input
  const normalized4 = normalizeBulbPercentages(null);
  console.log('\nTest Case 4: null input');
  console.log(`Input: null`);
  console.log(`Output: LED: ${normalized4.led}%, CFL: ${normalized4.cfl}%, Incandescent: ${normalized4.incandescent}%`);
  console.log(`Total: ${normalized4.led + normalized4.cfl + normalized4.incandescent}%`);
  
  // Test Case 5: NaN values
  const testCase5 = { led: NaN, cfl: 30, incandescent: 20 };
  const normalized5 = normalizeBulbPercentages(testCase5);
  console.log('\nTest Case 5: NaN values');
  console.log(`Input: LED: NaN, CFL: ${testCase5.cfl}, Incandescent: ${testCase5.incandescent}`);
  console.log(`Output: LED: ${normalized5.led}%, CFL: ${normalized5.cfl}%, Incandescent: ${normalized5.incandescent}%`);
  console.log(`Total: ${normalized5.led + normalized5.cfl + normalized5.incandescent}%`);
}

/**
 * Test bulb type description generation
 */
function testBulbTypeDescription() {
  console.log('\n--- Testing Bulb Type Description Generation ---');
  
  // Mock the normalizeBulbPercentages method
  const normalizeBulbPercentages = (percentages) => {
    // For this test, we'll just return the input as if it's already normalized
    return percentages;
  };
  
  // Implementation from lighting_data_normalization_implementation.js
  const getBulbTypeDescription = (bulbPercentages) => {
    try {
      // Check if we have valid data
      if (!bulbPercentages || 
          typeof bulbPercentages !== 'object' ||
          (
            (bulbPercentages.led === undefined || bulbPercentages.led === 0) && 
            (bulbPercentages.cfl === undefined || bulbPercentages.cfl === 0) && 
            (bulbPercentages.incandescent === undefined || bulbPercentages.incandescent === 0)
          )) {
        console.debug('No valid lighting data found');
        return 'Lighting data not available';
      }
      
      // Get normalized percentages (already normalized in this mock)
      const normalized = bulbPercentages;
      
      // Determine the dominant bulb type or mix
      if (normalized.led >= 70) {
        return 'Mostly LED Bulbs';
      } else if (normalized.incandescent >= 70) {
        return 'Mostly Incandescent Bulbs';
      } else if (normalized.cfl >= 70) {
        return 'Mostly CFL Bulbs';
      } else if (normalized.led >= 40 && normalized.cfl >= 40) {
        return 'Mix of LED and CFL Bulbs';
      } else if (normalized.led >= 40 && normalized.incandescent >= 40) {
        return 'Mix of LED and Incandescent Bulbs';
      } else if (normalized.cfl >= 40 && normalized.incandescent >= 40) {
        return 'Mix of CFL and Incandescent Bulbs';
      } else {
        return 'Mix of Bulb Types';
      }
    } catch (error) {
      console.error('Error generating bulb type description', error);
      return 'Mix of Bulb Types'; // Fallback
    }
  };
  
  // Test various bulb distributions
  const testCases = [
    { case: "Mostly LED", data: { led: 80, cfl: 10, incandescent: 10 } },
    { case: "Mostly Incandescent", data: { led: 10, cfl: 10, incandescent: 80 } },
    { case: "Mostly CFL", data: { led: 15, cfl: 75, incandescent: 10 } },
    { case: "LED and CFL Mix", data: { led: 45, cfl: 45, incandescent: 10 } },
    { case: "LED and Incandescent Mix", data: { led: 45, cfl: 10, incandescent: 45 } },
    { case: "CFL and Incandescent Mix", data: { led: 10, cfl: 45, incandescent: 45 } },
    { case: "Even Mix", data: { led: 33, cfl: 33, incandescent: 34 } },
    { case: "No Data", data: { led: 0, cfl: 0, incandescent: 0 } },
    { case: "null", data: null },
    { case: "Incomplete Data", data: { led: 30 } }
  ];
  
  testCases.forEach(testCase => {
    const description = getBulbTypeDescription(testCase.data);
    console.log(`${testCase.case}: ${description}`);
  });
}

/**
 * Test lighting efficiency chart calculations
 */
function testLightingEfficiencyCalculations() {
  console.log('\n--- Testing Lighting Efficiency Calculations ---');
  
  // Calculate energy usage based on bulb types
  const calculateLightingEfficiency = (bulbPercentages) => {
    // Standard efficiency factors: LED (1x), CFL (3x), Incandescent (10x)
    const ledEnergyUsage = bulbPercentages.led * 1;
    const cflEnergyUsage = bulbPercentages.cfl * 3;
    const incandescentEnergyUsage = bulbPercentages.incandescent * 10;
    
    // Calculate potential savings by switching to all LED
    const currentTotal = ledEnergyUsage + cflEnergyUsage + incandescentEnergyUsage;
    const potentialTotal = (bulbPercentages.led + bulbPercentages.cfl + bulbPercentages.incandescent) * 1;
    const potentialSavings = Math.round(((currentTotal - potentialTotal) / currentTotal) * 100);
    
    return {
      ledUsage: ledEnergyUsage,
      cflUsage: cflEnergyUsage,
      incandescentUsage: incandescentEnergyUsage,
      totalUsage: currentTotal,
      potentialUsage: potentialTotal,
      potentialSavings: potentialSavings
    };
  };
  
  // Test scenarios
  const scenarios = [
    { name: "All LED", bulbs: { led: 100, cfl: 0, incandescent: 0 } },
    { name: "All CFL", bulbs: { led: 0, cfl: 100, incandescent: 0 } },
    { name: "All Incandescent", bulbs: { led: 0, cfl: 0, incandescent: 100 } },
    { name: "Mixed (Standard Home)", bulbs: { led: 30, cfl: 30, incandescent: 40 } },
    { name: "Modern Home", bulbs: { led: 70, cfl: 20, incandescent: 10 } },
    { name: "Older Home", bulbs: { led: 10, cfl: 30, incandescent: 60 } }
  ];
  
  scenarios.forEach(scenario => {
    const efficiency = calculateLightingEfficiency(scenario.bulbs);
    console.log(`\nScenario: ${scenario.name}`);
    console.log(`Bulb Distribution: LED ${scenario.bulbs.led}%, CFL ${scenario.bulbs.cfl}%, Incandescent ${scenario.bulbs.incandescent}%`);
    console.log(`Energy Usage: LED: ${efficiency.ledUsage}, CFL: ${efficiency.cflUsage}, Incandescent: ${efficiency.incandescentUsage}`);
    console.log(`Total Energy Usage: ${efficiency.totalUsage} units`);
    console.log(`Potential All-LED Usage: ${efficiency.potentialUsage} units`);
    console.log(`Potential Energy Savings: ${efficiency.potentialSavings}%`);
  });
}

/**
 * Run all tests
 */
function runTests() {
  console.log('=== Lighting Data Normalization Improvements Test ===');
  testDefaultBulbPercentages();
  testNormalizeBulbPercentages();
  testBulbTypeDescription();
  testLightingEfficiencyCalculations();
  console.log('\n=== Test Complete ===');
}

// Execute tests
runTests();
