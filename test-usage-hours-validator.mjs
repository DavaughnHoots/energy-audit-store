/**
 * Test script for UsageHoursValidator
 * 
 * This script tests the functionality of the UsageHoursValidator utility,
 * which ensures energy consumption usage hours are valid and provides
 * intelligent defaults when needed.
 */

// Importing the validator using ES Module syntax
import { UsageHoursValidator } from './backend/build/utils/usageHoursValidator.js';

/**
 * Helper function to run tests and output results
 */
async function runTests() {
  console.log('---- Testing UsageHoursValidator Utility ----\n');
  
  testValidationFunction();
  testDefaultHours();
  testPatternCalculation();
  
  console.log('\n---- All tests completed ----');
}

/**
 * Test the main validation function
 */
function testValidationFunction() {
  console.log('Testing validateDailyUsageHours function:');
  
  const testCases = [
    // Valid values should be returned as-is
    { 
      input: { usageHours: 12, occupancyData: { type: 'standard', householdSize: 4 } },
      expected: 12,
      name: 'Valid hours value' 
    },
    // Invalid values should be replaced with defaults
    { 
      input: { usageHours: 0, occupancyData: { type: 'standard', householdSize: 2 } },
      expected: 12,
      name: 'Zero hours (invalid)' 
    },
    { 
      input: { usageHours: -5, occupancyData: { type: 'standard', householdSize: 2 } },
      expected: 12,
      name: 'Negative hours (invalid)' 
    },
    { 
      input: { usageHours: 25, occupancyData: { type: 'standard', householdSize: 2 } },
      expected: 12,
      name: 'Hours > 24 (invalid)' 
    },
    { 
      input: { usageHours: null, occupancyData: { type: 'standard', householdSize: 2 } },
      expected: 12,
      name: 'Null hours' 
    },
    { 
      input: { usageHours: undefined, occupancyData: { type: 'standard', householdSize: 2 } },
      expected: 12,
      name: 'Undefined hours' 
    },
    { 
      input: { usageHours: 'invalid', occupancyData: { type: 'standard', householdSize: 2 } },
      expected: 12,
      name: 'Non-numeric hours' 
    },
  ];
  
  // Run test cases
  testCases.forEach(testCase => {
    const { usageHours, occupancyData } = testCase.input;
    const result = UsageHoursValidator.validateDailyUsageHours(usageHours, occupancyData);
    const passed = result === testCase.expected;
    
    console.log(`${passed ? '✓' : '✗'} ${testCase.name}: ${result} (expected ${testCase.expected})`);
    
    if (!passed) {
      console.error(`  Error: Got ${result}, expected ${testCase.expected}`);
    }
  });
}

/**
 * Test the default hours generation based on occupancy type
 */
function testDefaultHours() {
  console.log('\nTesting defaults based on occupancy type:');
  
  const testCases = [
    { 
      input: { type: 'fullTime', householdSize: 2 },
      expected: 16,
      name: 'Full-time occupancy' 
    },
    { 
      input: { type: 'standard', householdSize: 2 },
      expected: 12,
      name: 'Standard occupancy' 
    },
    { 
      input: { type: 'partTime', householdSize: 2 },
      expected: 8,
      name: 'Part-time occupancy' 
    },
    { 
      input: { type: 'weekendOnly', householdSize: 2 },
      expected: 6,
      name: 'Weekend-only occupancy' 
    },
    { 
      input: { type: 'seasonal', householdSize: 2 },
      expected: 4,
      name: 'Seasonal occupancy' 
    },
    { 
      input: { type: 'vacant', householdSize: 2 },
      expected: 2,
      name: 'Vacant property' 
    },
    // Test household size adjustments
    { 
      input: { type: 'standard', householdSize: 4 }, 
      expected: 13,  // 12 + (4-2)*0.5 = 13
      name: 'Standard with 4-person household' 
    },
    { 
      input: { type: 'standard', householdSize: 5 }, 
      expected: 13.5,  // 12 + (5-2)*0.5 = 13.5
      name: 'Standard with 5-person household' 
    },
    // Test invalid occupancy type
    { 
      input: { type: 'invalidType', householdSize: 2 },
      expected: 12,
      name: 'Invalid occupancy type (fallback to standard)' 
    }
  ];
  
  // Run test cases
  testCases.forEach(testCase => {
    const result = UsageHoursValidator.validateDailyUsageHours(undefined, testCase.input);
    const passed = result === testCase.expected;
    
    console.log(`${passed ? '✓' : '✗'} ${testCase.name}: ${result} (expected ${testCase.expected})`);
    
    if (!passed) {
      console.error(`  Error: Got ${result}, expected ${testCase.expected}`);
    }
  });
}

/**
 * Test the daily hours calculation based on wake and sleep patterns
 */
function testPatternCalculation() {
  console.log('\nTesting hours calculation based on wake & sleep patterns:');
  
  const testCases = [
    { 
      input: { wakeTime: 'standard', sleepTime: 'standard', occupancyType: 'standard' },
      expected: 12,
      name: 'Standard wake & sleep times' 
    },
    { 
      input: { wakeTime: 'early', sleepTime: 'standard', occupancyType: 'standard' },
      expected: 13,
      name: 'Early wake, standard sleep' 
    },
    { 
      input: { wakeTime: 'standard', sleepTime: 'late', occupancyType: 'standard' },
      expected: 13,
      name: 'Standard wake, late sleep' 
    },
    { 
      input: { wakeTime: 'early', sleepTime: 'late', occupancyType: 'standard' },
      expected: 14,
      name: 'Early wake, late sleep' 
    },
    { 
      input: { wakeTime: 'late', sleepTime: 'early', occupancyType: 'standard' },
      expected: 10,
      name: 'Late wake, early sleep' 
    },
    { 
      input: { wakeTime: 'varied', sleepTime: 'varied', occupancyType: 'standard' },
      expected: 12,
      name: 'Varied wake & sleep' 
    },
    { 
      input: { wakeTime: 'early', sleepTime: 'late', occupancyType: 'partTime' },
      expected: 10,
      name: 'Early wake, late sleep (part-time base)' 
    }
  ];
  
  // Run test cases
  testCases.forEach(testCase => {
    const { wakeTime, sleepTime, occupancyType } = testCase.input;
    const result = UsageHoursValidator.calculateHoursFromPattern(wakeTime, sleepTime, occupancyType);
    const passed = result === testCase.expected;
    
    console.log(`${passed ? '✓' : '✗'} ${testCase.name}: ${result} (expected ${testCase.expected})`);
    
    if (!passed) {
      console.error(`  Error: Got ${result}, expected ${testCase.expected}`);
    }
  });
}

// Run all the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
