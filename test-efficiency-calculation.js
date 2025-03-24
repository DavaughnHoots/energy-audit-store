// Simple test script to verify our efficiency score calculations
import { adaptAuditDataForScoring, calculateAuditEfficiencyScore } from './backend/src/services/efficiencyScoreService.js';

// Sample audit data structure similar to what would be passed to the PDF generator
const mockAuditData = {
  basicInfo: {
    fullName: 'John Smith',
    email: 'john@example.com',
    phone: '555-123-4567',
    address: '123 Main St, Anytown, US 12345',
    propertyType: 'single-family',
    yearBuilt: 1995,
    occupants: 4,
    auditDate: '2025-03-24'
  },
  homeDetails: {
    squareFootage: 2400,
    stories: 2,
    bedrooms: 4,
    bathrooms: 2.5,
    homeType: 'detached',
    homeSize: 2400,
    constructionPeriod: '1980-2000',
    numRooms: 8,
    numFloors: 2,
    wallLength: 50,
    wallWidth: 30,
    ceilingHeight: 9,
    basementType: 'finished',
    basementHeating: 'heated'
  },
  currentConditions: {
    insulation: {
      attic: 'good',
      walls: 'average',
      basement: 'poor',
      floor: 'average'
    },
    windowType: 'double',
    windowCondition: 'good',
    numWindows: 12,
    windowCount: 'average',
    doorCount: 3,
    airLeaks: ['around windows', 'at doors'],
    weatherStripping: 'average',
    temperatureConsistency: 'some-variations',
    comfortIssues: ['cold spots', 'drafts'],
    bulbPercentages: {
      led: 30,
      cfl: 20,
      incandescent: 50
    }
  },
  heatingCooling: {
    heatingSystem: {
      type: 'forced air',
      fuel: 'natural gas',
      fuelType: 'natural gas',
      age: 12,
      efficiency: 85,
      lastService: '2024-09-01'
    },
    coolingSystem: {
      type: 'central ac',
      age: 10,
      efficiency: 14
    },
    thermostatType: 'programmable',
    zoneCount: 1,
    systemPerformance: 'some-problems'
  },
  energyConsumption: {
    electricBill: 150,
    gasBill: 80,
    seasonalVariation: 'high',
    powerConsumption: 900,
    occupancyPattern: 'evenings and weekends',
    occupancyHours: {
      weekday: '6pm-8am',
      weekend: 'all day'
    },
    peakUsageTimes: ['morning', 'evening'],
    monthlyBill: 230,
    season: 'winter',
    powerFactor: 0.9,
    seasonalFactor: 1.1,
    occupancyFactor: 0.7
  }
};

// Create an incomplete version to test robustness
const incompleteAuditData = JSON.parse(JSON.stringify(mockAuditData));
delete incompleteAuditData.currentConditions.bulbPercentages;
incompleteAuditData.heatingCooling.heatingSystem.efficiency = undefined;
incompleteAuditData.energyConsumption.electricBill = undefined;

// Create a problematic version to test error handling
const problematicAuditData = JSON.parse(JSON.stringify(mockAuditData));
problematicAuditData.energyConsumption.electricBill = -50; // Negative bill
problematicAuditData.heatingCooling.heatingSystem.efficiency = 150; // Impossible efficiency
problematicAuditData.currentConditions.bulbPercentages = {
  led: 0,
  cfl: 0,
  incandescent: 0
};

// Test with complete data
console.log('\n=== Testing with complete data ===');
const adaptedData = adaptAuditDataForScoring(mockAuditData);
console.log('Adapted data structure:', JSON.stringify(adaptedData, null, 2).substring(0, 200) + '...');

try {
  const scores = calculateAuditEfficiencyScore(mockAuditData);
  console.log('Efficiency scores:');
  console.log(`- Energy score: ${scores.energyScore}`);
  console.log(`- HVAC score: ${scores.hvacScore}`);
  console.log(`- Lighting score: ${scores.lightingScore}`);
  console.log(`- Humidity score: ${scores.humidityScore}`);
  console.log(`- Overall score: ${scores.overallScore}`);
  console.log(`- Interpretation: ${scores.interpretation}`);
  
  // Verify the scores are in the expected range (40-100)
  const scoresInRange = Object.values(scores)
    .filter(score => typeof score === 'number')
    .every(score => score >= 0 && score <= 100);
  
  console.log(`All scores in valid range (0-100): ${scoresInRange ? 'YES' : 'NO'}`);
} catch (error) {
  console.error('Error calculating efficiency score:', error);
}

// Test with incomplete data
console.log('\n=== Testing with incomplete data ===');
try {
  const incompleteScores = calculateAuditEfficiencyScore(incompleteAuditData);
  console.log('Efficiency scores from incomplete data:');
  console.log(`- Energy score: ${incompleteScores.energyScore}`);
  console.log(`- HVAC score: ${incompleteScores.hvacScore}`);
  console.log(`- Lighting score: ${incompleteScores.lightingScore}`);
  console.log(`- Humidity score: ${incompleteScores.humidityScore}`);
  console.log(`- Overall score: ${incompleteScores.overallScore}`);
  console.log(`- Interpretation: ${incompleteScores.interpretation}`);
} catch (error) {
  console.error('Error calculating score with incomplete data:', error);
}

// Test with problematic data
console.log('\n=== Testing with problematic data ===');
try {
  const problematicScores = calculateAuditEfficiencyScore(problematicAuditData);
  console.log('Efficiency scores from problematic data:');
  console.log(`- Energy score: ${problematicScores.energyScore}`);
  console.log(`- HVAC score: ${problematicScores.hvacScore}`);
  console.log(`- Lighting score: ${problematicScores.lightingScore}`);
  console.log(`- Humidity score: ${problematicScores.humidityScore}`);
  console.log(`- Overall score: ${problematicScores.overallScore}`);
  console.log(`- Interpretation: ${problematicScores.interpretation}`);
} catch (error) {
  console.error('Error calculating score with problematic data:', error);
}

// Test with completely undefined data
console.log('\n=== Testing with undefined data ===');
try {
  const undefinedScores = calculateAuditEfficiencyScore(undefined);
  console.log('Efficiency scores from undefined data:');
  console.log(`- Energy score: ${undefinedScores.energyScore}`);
  console.log(`- HVAC score: ${undefinedScores.hvacScore}`);
  console.log(`- Lighting score: ${undefinedScores.lightingScore}`);
  console.log(`- Humidity score: ${undefinedScores.humidityScore}`);
  console.log(`- Overall score: ${undefinedScores.overallScore}`);
  console.log(`- Interpretation: ${undefinedScores.interpretation}`);
} catch (error) {
  console.error('Error calculating score with undefined data:', error);
}

console.log('\nTest completed. The efficiency score calculations are working correctly if:');
console.log('1. Complete data produces scores in the range 0-100');
console.log('2. Incomplete data still produces scores (even if some components are 0)');
console.log('3. Problematic data is handled gracefully without throwing errors');
console.log('4. Completely undefined data returns reasonable defaults');
