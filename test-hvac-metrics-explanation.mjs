/**
 * Test script for HVAC metrics explanation service
 */
import { HvacMetricsExplanationService } from './backend/build/services/hvacMetricsExplanationService.js';

/**
 * Helper function to run tests and output results
 */
async function runTests() {
  console.log('---- Testing HvacMetricsExplanationService ----\n');
  
  const service = new HvacMetricsExplanationService();
  
  testCoolingEfficiencyRatings(service);
  testHeatingEfficiencyRatings(service);
  testRegionalStandards(service);
  testEfficiencyFormatting(service);
  testExplanations(service);
  
  console.log('\n---- All tests completed ----');
}

/**
 * Test cooling efficiency ratings
 */
function testCoolingEfficiencyRatings(service) {
  console.log('Testing cooling efficiency ratings:');
  
  const testCases = [
    { type: 'central-ac', efficiency: 18, expected: 'Excellent' },
    { type: 'central-ac', efficiency: 16, expected: 'Good' },
    { type: 'central-ac', efficiency: 14, expected: 'Average' },
    { type: 'central-ac', efficiency: 11, expected: 'Poor' },
    { type: 'central-ac', efficiency: 9, expected: 'Very Poor' },
    { type: 'mini-split', efficiency: 22, expected: 'Excellent' },
    { type: 'mini-split', efficiency: 18, expected: 'Good' },
    { type: 'mini-split', efficiency: 15, expected: 'Average' },
    { type: 'mini-split', efficiency: 14, expected: 'Poor' },
    { type: 'mini-split', efficiency: 12, expected: 'Very Poor' },
    { type: 'central-ac', efficiency: 0, expected: 'Unknown' },
    { type: 'central-ac', efficiency: null, expected: 'Unknown' },
    { type: 'central-ac', efficiency: undefined, expected: 'Unknown' },
  ];
  
  for (const test of testCases) {
    const result = service.getCoolingEfficiencyRating(test.type, test.efficiency);
    const passed = result.classification === test.expected;
    
    console.log(`${passed ? '✓' : '✗'} ${test.type} with ${test.efficiency} SEER: ${result.classification} (expected ${test.expected})`);
    
    if (!passed) {
      console.error(`  Failed: Got ${result.classification}, expected ${test.expected}`);
    }
  }
}

/**
 * Test heating efficiency ratings
 */
function testHeatingEfficiencyRatings(service) {
  console.log('\nTesting heating efficiency ratings:');
  
  const testCases = [
    { type: 'heat pump', efficiency: 11, expected: 'Excellent' },
    { type: 'heat pump', efficiency: 9.5, expected: 'Good' },
    { type: 'heat pump', efficiency: 8.5, expected: 'Average' },
    { type: 'heat pump', efficiency: 7.5, expected: 'Poor' },
    { type: 'heat pump', efficiency: 6.5, expected: 'Very Poor' },
    { type: 'furnace', efficiency: 98, expected: 'Excellent' },
    { type: 'furnace', efficiency: 92, expected: 'Good' },
    { type: 'furnace', efficiency: 85, expected: 'Average' },
    { type: 'furnace', efficiency: 75, expected: 'Poor' },
    { type: 'furnace', efficiency: 65, expected: 'Very Poor' },
    // Test normalization
    { type: 'furnace', efficiency: 0.92, expected: 'Good' },
    { type: 'furnace', efficiency: 250, expected: 'Excellent' }, // Should normalize to 2.5
    { type: 'furnace', efficiency: 0, expected: 'Unknown' },
    { type: 'heat pump', efficiency: null, expected: 'Unknown' },
  ];
  
  for (const test of testCases) {
    const result = service.getHeatingEfficiencyRating(test.type, test.efficiency);
    const passed = result.classification === test.expected;
    
    console.log(`${passed ? '✓' : '✗'} ${test.type} with ${test.efficiency} efficiency: ${result.classification} (expected ${test.expected})`);
    
    if (!passed) {
      console.error(`  Failed: Got ${result.classification}, expected ${test.expected}`);
    }
  }
}

/**
 * Test regional standards
 */
function testRegionalStandards(service) {
  console.log('\nTesting regional standards:');
  
  const regionTests = [
    { state: 'NY', region: 'north', minSeer: 13 },
    { state: 'FL', region: 'south', minSeer: 14 },
    { state: 'CA', region: 'southwest', minSeer: 14 },
    { state: 'XX', region: 'default', minSeer: 13 }, // Invalid state
  ];
  
  for (const test of regionTests) {
    const standards = service.getRegionalStandards(test.state);
    const passed = standards.cooling.minSeer === test.minSeer;
    
    console.log(`${passed ? '✓' : '✗'} ${test.state} (${test.region}): Min SEER = ${standards.cooling.minSeer} (expected ${test.minSeer})`);
    
    if (!passed) {
      console.error(`  Failed: Got ${standards.cooling.minSeer}, expected ${test.minSeer}`);
    }
  }
}

/**
 * Test efficiency formatting
 */
function testEfficiencyFormatting(service) {
  console.log('\nTesting efficiency value formatting:');
  
  const formatTests = [
    { type: 'heat pump', value: 9.8, expected: '9.8 HSPF' },
    { type: 'furnace', value: 92, expected: '92% AFUE' },
    { type: 'furnace', value: 0.92, expected: '92% AFUE' },
    { type: 'furnace', value: 250, expected: '3% AFUE (normalized)' },
    { type: 'central-ac', value: 16.5, expected: '16.5 SEER' },
    { type: 'unknown', value: 123, expected: '123' },
    { type: 'heat pump', value: null, expected: 'N/A' },
  ];
  
  for (const test of formatTests) {
    const result = service.formatEfficiencyValue(test.type, test.value);
    const passed = result === test.expected;
    
    console.log(`${passed ? '✓' : '✗'} Format ${test.type} with ${test.value}: "${result}" (expected "${test.expected}")`);
    
    if (!passed) {
      console.error(`  Failed: Got "${result}", expected "${test.expected}"`);
    }
  }
}

/**
 * Test explanation content
 */
function testExplanations(service) {
  console.log('\nTesting explanation content:');
  
  // Test simple explanations
  const simpleExplanations = service.getHvacExplanations(false);
  const hasSimpleExplanations = simpleExplanations.simple && 
                                Object.keys(simpleExplanations.simple).length > 0 &&
                                !simpleExplanations.advanced;
  
  console.log(`${hasSimpleExplanations ? '✓' : '✗'} Simple explanations available`);
  
  if (!hasSimpleExplanations) {
    console.error(`  Failed: Simple explanations missing or advanced included incorrectly`);
  }
  
  // Test advanced explanations
  const advancedExplanations = service.getHvacExplanations(true);
  const hasAdvancedExplanations = advancedExplanations.simple && 
                                  advancedExplanations.advanced &&
                                  Object.keys(advancedExplanations.advanced).length > 0;
  
  console.log(`${hasAdvancedExplanations ? '✓' : '✗'} Advanced explanations available when requested`);
  
  if (!hasAdvancedExplanations) {
    console.error(`  Failed: Advanced explanations missing`);
  }
  
  // Test target efficiency
  const heatPumpTarget = service.getTargetEfficiency('heating', 'heat pump');
  const furnaceTarget = service.getTargetEfficiency('heating', 'furnace');
  const centralAcTarget = service.getTargetEfficiency('cooling', 'central-ac');
  const miniSplitTarget = service.getTargetEfficiency('cooling', 'mini-split');
  
  console.log(`${heatPumpTarget === 9.0 ? '✓' : '✗'} Heat pump target efficiency: ${heatPumpTarget} (expected 9.0)`);
  console.log(`${furnaceTarget === 90 ? '✓' : '✗'} Furnace target efficiency: ${furnaceTarget} (expected 90)`);
  console.log(`${centralAcTarget === 16 ? '✓' : '✗'} Central AC target efficiency: ${centralAcTarget} (expected 16)`);
  console.log(`${miniSplitTarget === 18 ? '✓' : '✗'} Mini-split target efficiency: ${miniSplitTarget} (expected 18)`);
}

// Run all tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
