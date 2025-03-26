/**
 * Test script for recommendation financial data improvements
 * 
 * This script tests the improvements to the recommendation financial data
 * implemented in the ReportValidationHelper class.
 */

// Use CommonJS syntax instead of ES modules
const { ReportValidationHelper } = require('./backend/src/utils/reportValidationHelper.js');

// Create sample recommendations with missing financial data
const sampleRecommendations = [
  {
    id: 'rec-1',
    title: 'Lighting System Upgrade',
    description: 'Upgrade to energy efficient LED lighting throughout the home.',
    type: 'Lighting System Upgrade',
    priority: 'medium',
    status: 'active',
    estimatedSavings: null, // Missing data
    estimatedCost: null,    // Missing data
    paybackPeriod: null,    // Missing data
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'rec-2',
    title: 'HVAC System Upgrade',
    description: 'Replace the current HVAC system with a high-efficiency model.',
    type: 'HVAC System Upgrade',
    priority: 'high',
    status: 'active',
    estimatedSavings: null, // Missing data
    estimatedCost: null,    // Missing data
    paybackPeriod: null,    // Missing data
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 'rec-3',
    title: 'Upgrade Insulation',
    description: 'Improve attic insulation to reduce heat loss.',
    type: 'Upgrade Insulation',
    priority: 'medium',
    status: 'active',
    scope: 'attic only', // Partial home recommendation
    estimatedSavings: null, // Missing data
    estimatedCost: null,    // Missing data
    paybackPeriod: null,    // Missing data
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: new Date().toISOString()
  }
];

// Test the validation helper with sample recommendations
console.log('Testing ReportValidationHelper with incomplete recommendations');
console.log('==========================================');

try {
  // Validate the recommendations
  const validatedRecommendations = ReportValidationHelper.validateRecommendations(sampleRecommendations);
  
  // Display the results
  console.log('Original recommendations:');
  sampleRecommendations.forEach(rec => {
    console.log(`- ${rec.title}`);
    console.log(`  Savings: ${rec.estimatedSavings}`);
    console.log(`  Cost: ${rec.estimatedCost}`);
    console.log(`  Payback: ${rec.paybackPeriod}`);
    console.log('');
  });
  
  console.log('\nValidated recommendations:');
  validatedRecommendations.forEach(rec => {
    console.log(`- ${rec.title}`);
    console.log(`  Savings: $${rec.estimatedSavings}/year`);
    console.log(`  Cost: $${rec.estimatedCost}`);
    console.log(`  Payback: ${rec.paybackPeriod} years`);
    console.log(`  Scope: ${rec.scope || 'whole-home'}`);
    console.log(`  Is Estimated: ${rec.isEstimated ? 'Yes' : 'No'}`);
    console.log('');
  });
  
  // Test with individual recommendations
  console.log('\nTesting individual recommendation validation:');
  
  const lightingRec = ReportValidationHelper.validateSingleRecommendation({
    id: 'rec-test',
    title: 'Replace bulbs with LEDs',
    description: 'Replace all incandescent bulbs with energy-efficient LEDs.',
    type: 'Replace Inefficient Fixtures',
    priority: 'medium',
    status: 'active',
    lastUpdate: new Date().toISOString()
  });
  
  console.log('- Lighting recommendation:');
  console.log(`  Savings: $${lightingRec.estimatedSavings}/year`);
  console.log(`  Cost: $${lightingRec.estimatedCost}`);
  console.log(`  Payback: ${lightingRec.paybackPeriod} years`);
  
  // Test with null recommendation
  console.log('\nTesting with null recommendation (should create default):');
  const defaultRec = ReportValidationHelper.validateSingleRecommendation(null);
  console.log(`- ${defaultRec.title}`);
  console.log(`  Type: ${defaultRec.type}`);
  console.log(`  Savings: $${defaultRec.estimatedSavings}/year`);
  console.log(`  Cost: $${defaultRec.estimatedCost}`);
  console.log(`  Payback: ${defaultRec.paybackPeriod} years`);
  
  console.log('\nTest completed successfully!');
} catch (error) {
  console.error('Error during testing:', error);
}
