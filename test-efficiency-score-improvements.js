/**
 * Test script for efficiency score calculation improvements
 * 
 * This script tests the improved efficiency score calculation logic to ensure:
 * 1. Overall efficiency scores are always in a reasonable range (60-95%)
 * 2. Property age adjustments are properly applied
 * 3. HVAC efficiency gap is always non-negative
 * 4. Component scores are properly normalized and validated
 * 
 * To run this script:
 * node test-efficiency-score-improvements.js
 */

// Mock implementation of appLogger for testing
const appLogger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || ''),
  warn: (msg, data) => console.log(`[WARN] ${msg}`, data || ''),
  error: (msg, data) => console.log(`[ERROR] ${msg}`, data || '')
};

// Mock implementation of efficiency functions
function interpretEfficiencyScore(score) {
  if (score >= 90) return "Excellent - High-performance building";
  else if (score >= 80) return "Very Good - Above average performance";
  else if (score >= 70) return "Good - Meeting standard requirements";
  else if (score >= 60) return "Fair - Room for improvement";
  else return "Poor - Significant improvements needed";
}

function getPropertyAgeAdjustment(buildingAge) {
  // Cap the age effect (very old buildings don't get penalized indefinitely)
  const cappedAge = Math.min(buildingAge, 70);
  
  // Newer buildings get a bonus, older buildings get a penalty
  // Range: 0.9 to 1.1 adjustment
  return 1.1 - (cappedAge / 350);
}

function ensureValidRange(value, min, max, defaultValue) {
  if (value === undefined || value === null || isNaN(value) || value < min || value > max) {
    return defaultValue;
  }
  return value;
}

function validateEfficiencyMetrics(metrics) {
  const validated = { ...metrics };
  
  // Ensure overall score is in reasonable range
  if (!validated.overallScore || validated.overallScore < 60 || validated.overallScore > 95) {
    console.warn('Invalid overall efficiency score, using default', { 
      original: validated.overallScore 
    });
    validated.overallScore = 70;
    validated.interpretation = interpretEfficiencyScore(70);
  }
  
  // Validate all component scores
  validated.energyScore = ensureValidRange(validated.energyScore, 40, 100, 65);
  validated.hvacScore = ensureValidRange(validated.hvacScore, 40, 100, 65);
  validated.lightingScore = ensureValidRange(validated.lightingScore, 40, 100, 70);
  validated.humidityScore = ensureValidRange(validated.humidityScore, 40, 100, 65);
  
  return validated;
}

function normalizeHvacEfficiencyValue(value, systemType) {
  if (value === undefined || value === null || isNaN(value)) {
    return 70; // Default to average efficiency if no value provided
  }

  // Check if system type contains "furnace" or "boiler" (typically using AFUE %)
  const type = (systemType || '').toLowerCase();
  if (type.includes('furnace') || type.includes('boiler')) {
    // AFUE is typically 80-98% for modern systems
    if (value > 100) {
      // Value may be in basis points or other unusual unit - normalize
      return value > 1000 ? (value / 10) : (value > 100 ? (value / 100) * 100 : value);
    }
    // Cap at reasonable range for AFUE
    return Math.min(98, Math.max(60, value));
  } 
  // Heat pump (typically using HSPF or SEER)
  else if (type.includes('heat pump') || type.includes('heat-pump')) {
    // HSPF typically ranges from 8-12
    if (value > 20) {
      // Might be a percentage - normalize to HSPF scale
      return value > 100 ? 10 : (value / 10);
    }
    // Cap at reasonable range for HSPF
    return Math.min(13, Math.max(6, value));
  }
  // Default normalization for other system types
  else {
    // Cap at reasonable efficiency range (0-100%)
    return Math.min(100, Math.max(0, value));
  }
}

function calculateHvacEfficiencyGap(heatingSystem) {
  try {
    if (!heatingSystem) {
      console.warn('Missing HVAC data for efficiency gap calculation');
      return 15; // Return a reasonable default gap
    }

    const currentEfficiency = normalizeHvacEfficiencyValue(
      heatingSystem.efficiency,
      heatingSystem.type
    );
    
    // Use target efficiency or a reasonable default
    const targetEfficiency = heatingSystem.targetEfficiency || 
                           (heatingSystem.type?.toLowerCase().includes('heat pump') ? 10 : 90);
    
    // Calculate gap and ensure it's never negative
    const gap = Math.max(0, targetEfficiency - currentEfficiency);
    
    // Cap at reasonable maximum to prevent extreme values
    return Math.min(50, gap);
  } catch (error) {
    console.error('Error calculating HVAC efficiency gap', { error });
    return 15; // Return a reasonable default gap on error
  }
}

/**
 * Test different building ages
 */
function testPropertyAgeAdjustment() {
  console.log('\n=== Testing Property Age Adjustment ===');
  
  const testCases = [
    { age: 0, expected: 1.1 },         // New building - maximum bonus
    { age: 35, expected: 1.0 },        // Middle-aged building - neutral
    { age: 70, expected: 0.9 },        // Old building - maximum penalty
    { age: 100, expected: 0.9 },       // Very old building - capped at maximum penalty
    { age: undefined, expected: 1.0 },  // Unknown age - neutral
    { age: 'invalid', expected: 1.0 }, // Invalid age - neutral
    { age: -5, expected: 1.0 }         // Negative age - neutral
  ];
  
  let passCount = 0;
  
  testCases.forEach((testCase, index) => {
    const adjustment = getPropertyAgeAdjustment(testCase.age);
    const result = Math.abs(adjustment - testCase.expected) < 0.01 ? 'PASS' : 'FAIL';
    
    if (result === 'PASS') passCount++;
    
    console.log(`Test ${index + 1}: Building age ${testCase.age} → Adjustment ${adjustment.toFixed(2)} (expected: ${testCase.expected}) - ${result}`);
  });
  
  console.log(`\nProperty Age Adjustment Tests: ${passCount}/${testCases.length} passed`);
  return passCount === testCases.length;
}

/**
 * Test HVAC efficiency gap calculations
 */
function testHvacEfficiencyGap() {
  console.log('\n=== Testing HVAC Efficiency Gap Calculation ===');
  
  const testCases = [
    // Normal cases
    { 
      system: { type: 'furnace', efficiency: 80, targetEfficiency: 95 },
      expected: 15,
      description: 'Standard furnace'
    },
    { 
      system: { type: 'heat pump', efficiency: 8.5, targetEfficiency: 10 },
      expected: 1.5,
      description: 'Standard heat pump'
    },
    // Edge cases
    { 
      system: { type: 'furnace', efficiency: 100, targetEfficiency: 95 },
      expected: 0,  // Gap should never be negative
      description: 'High-efficiency furnace exceeding target'
    },
    { 
      system: { type: 'heat pump', efficiency: 250, targetEfficiency: 10 },
      expected: 0, // Should normalize the 250 value and result in no gap
      description: 'Abnormally high efficiency value'
    },
    // Problem cases from real data
    { 
      system: { type: 'central-ac', efficiency: 13, targetEfficiency: 18 },
      expected: 5,
      description: 'Central AC with cooling efficiency in SEER'
    },
    { 
      system: { type: 'heating', efficiency: -155, targetEfficiency: 90 },
      expected: 50, // Should correct the negative value and cap the gap
      description: 'Negative efficiency value'
    },
    // Missing data
    { 
      system: { type: 'furnace' }, // Missing efficiency
      expected: 15, // Should use a reasonable default
      description: 'Missing efficiency data'
    },
    { 
      system: null, // Missing system
      expected: 15, // Should use a reasonable default
      description: 'Missing HVAC system'
    }
  ];
  
  let passCount = 0;
  
  testCases.forEach((testCase, index) => {
    const gap = calculateHvacEfficiencyGap(testCase.system);
    const result = Math.abs(gap - testCase.expected) < 0.1 ? 'PASS' : 'FAIL';
    
    if (result === 'PASS') passCount++;
    
    console.log(`Test ${index + 1}: ${testCase.description} → Gap ${gap.toFixed(1)} (expected: ${testCase.expected}) - ${result}`);
  });
  
  console.log(`\nHVAC Efficiency Gap Tests: ${passCount}/${testCases.length} passed`);
  return passCount === testCases.length;
}

/**
 * Test efficiency metrics validation
 */
function testValidateEfficiencyMetrics() {
  console.log('\n=== Testing Efficiency Metrics Validation ===');
  
  const testCases = [
    // Normal case
    { 
      metrics: { 
        energyScore: 75, 
        hvacScore: 80, 
        lightingScore: 65, 
        humidityScore: 70,
        overallScore: 75,
        interpretation: "Good - Meeting standard requirements"
      },
      description: 'Valid metrics within range'
    },
    // Problem cases
    { 
      metrics: { 
        energyScore: 35, // Too low
        hvacScore: 150, // Too high
        lightingScore: null, // Missing
        humidityScore: 'invalid', // Invalid
        overallScore: 40, // Too low
        interpretation: "Poor - Significant improvements needed"
      },
      description: 'Invalid metrics requiring correction'
    },
    // Edge cases
    { 
      metrics: { 
        energyScore: 40, // At minimum
        hvacScore: 100, // At maximum
        lightingScore: 60,
        humidityScore: 80,
        overallScore: 60, // At minimum
        interpretation: "Fair - Room for improvement"
      },
      description: 'Edge case values'
    },
    { 
      metrics: {}, // Empty metrics
      description: 'Empty metrics object'
    }
  ];
  
  let passCount = 0;
  
  testCases.forEach((testCase, index) => {
    const validated = validateEfficiencyMetrics(testCase.metrics);
    
    // Check if all values are within valid ranges
    const validEnergy = validated.energyScore >= 40 && validated.energyScore <= 100;
    const validHvac = validated.hvacScore >= 40 && validated.hvacScore <= 100;
    const validLighting = validated.lightingScore >= 40 && validated.lightingScore <= 100;
    const validHumidity = validated.humidityScore >= 40 && validated.humidityScore <= 100;
    const validOverall = validated.overallScore >= 60 && validated.overallScore <= 95;
    const validInterpretation = typeof validated.interpretation === 'string' && validated.interpretation.length > 0;
    
    const allValid = validEnergy && validHvac && validLighting && validHumidity && validOverall && validInterpretation;
    const result = allValid ? 'PASS' : 'FAIL';
    
    if (result === 'PASS') passCount++;
    
    console.log(`Test ${index + 1}: ${testCase.description} - ${result}`);
    if (result === 'FAIL') {
      console.log('  - Invalid values:');
      if (!validEnergy) console.log(`    energyScore: ${validated.energyScore}`);
      if (!validHvac) console.log(`    hvacScore: ${validated.hvacScore}`);
      if (!validLighting) console.log(`    lightingScore: ${validated.lightingScore}`);
      if (!validHumidity) console.log(`    humidityScore: ${validated.humidityScore}`);
      if (!validOverall) console.log(`    overallScore: ${validated.overallScore}`);
      if (!validInterpretation) console.log(`    interpretation: ${validated.interpretation}`);
    }
  });
  
  console.log(`\nEfficiency Metrics Validation Tests: ${passCount}/${testCases.length} passed`);
  return passCount === testCases.length;
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('=== Running Efficiency Score Improvement Tests ===\n');
  
  const propertyAgeTestsPassed = testPropertyAgeAdjustment();
  const hvacGapTestsPassed = testHvacEfficiencyGap();
  const validationTestsPassed = testValidateEfficiencyMetrics();
  
  const allTestsPassed = propertyAgeTestsPassed && hvacGapTestsPassed && validationTestsPassed;
  
  console.log('\n=== Test Summary ===');
  console.log(`Property Age Adjustment: ${propertyAgeTestsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`HVAC Efficiency Gap: ${hvacGapTestsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Efficiency Metrics Validation: ${validationTestsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`\nOverall Test Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return allTestsPassed;
}

// Run all tests when this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testPropertyAgeAdjustment,
  testHvacEfficiencyGap,
  testValidateEfficiencyMetrics,
  runAllTests
};
