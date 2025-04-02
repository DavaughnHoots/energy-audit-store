/**
 * PDF Report Generation Fix
 * 
 * This script tests the PDF report generation functionality with 
 * debugging enhancements to identify and fix the issue causing
 * "Invalid audit data structure" errors.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sample audit data for testing
const testAudit = {
  // Using snake_case like the database
  basic_info: {
    fullName: 'Test User',
    email: 'test@example.com',
    address: '123 Test St, Testville, TS 12345',
    propertyType: 'single-family',
    yearBuilt: 2000,
    occupants: 3,
    auditDate: '2025-04-02'
  },
  home_details: {
    squareFootage: 2000,
    stories: 2,
    bedrooms: 3,
    bathrooms: 2,
    homeType: 'detached',
    constructionPeriod: '1980-2000'
  },
  current_conditions: {
    insulation: {
      attic: 'average',
      walls: 'average',
      basement: 'poor',
      floor: 'average'
    },
    windowType: 'double',
    windowCondition: 'good',
    airLeaks: ['around windows', 'at doors'],
    weatherStripping: 'average',
    bulbPercentages: {
      led: 30,
      cfl: 20,
      incandescent: 50
    }
  },
  heating_cooling: {
    heatingSystem: {
      type: 'forced air',
      fuel: 'natural gas',
      fuelType: 'natural gas',
      age: 12,
      efficiency: 85
    },
    coolingSystem: {
      type: 'central ac',
      age: 10,
      efficiency: 14
    },
    thermostatType: 'programmable'
  },
  energy_consumption: {
    electricBill: 150,
    gasBill: 80,
    seasonalVariation: 'high',
    occupancyPattern: 'evenings and weekends'
  },
  product_preferences: {
    budget: 'medium',
    priorities: ['efficiency', 'cost', 'durability'],
    preferredBrands: []
  }
};

// Sample recommendations for testing
const testRecommendations = [
  {
    id: 'rec-001',
    title: 'Install LED Bulbs',
    description: 'Replace all incandescent bulbs with LED alternatives.',
    priority: 'high',
    status: 'active',
    estimatedSavings: 250,
    estimatedCost: 120
  },
  {
    id: 'rec-002',
    title: 'Seal Air Leaks',
    description: 'Apply weatherstripping and caulk around doors and windows.',
    priority: 'medium',
    status: 'active',
    estimatedSavings: 180,
    estimatedCost: 75
  }
];

/**
 * This is a fixed version of the data transformation function from energyAudit.ts
 * It addresses potential issues that could cause the "Invalid audit data structure" error
 */
function transformAuditData(audit) {
  console.log('Original audit data keys:', Object.keys(audit));
  
  // Create a deep copy to avoid modifying the original
  const auditCopy = JSON.parse(JSON.stringify(audit));
  
  // Fix 1: Always ensure each section exists and parse if needed
  const transformedAudit = {
    basicInfo: typeof auditCopy.basic_info === 'string' 
      ? JSON.parse(auditCopy.basic_info) 
      : (auditCopy.basic_info || {}),
      
    homeDetails: typeof auditCopy.home_details === 'string' 
      ? JSON.parse(auditCopy.home_details) 
      : (auditCopy.home_details || {}),
      
    currentConditions: typeof auditCopy.current_conditions === 'string' 
      ? JSON.parse(auditCopy.current_conditions) 
      : (auditCopy.current_conditions || {}),
      
    heatingCooling: typeof auditCopy.heating_cooling === 'string' 
      ? JSON.parse(auditCopy.heating_cooling) 
      : (auditCopy.heating_cooling || {}),
      
    energyConsumption: typeof auditCopy.energy_consumption === 'string' 
      ? JSON.parse(auditCopy.energy_consumption) 
      : (auditCopy.energy_consumption || {})
  };
  
  // Fix 2: Safely add product preferences if they exist
  if (auditCopy.product_preferences) {
    transformedAudit.productPreferences = typeof auditCopy.product_preferences === 'string'
      ? JSON.parse(auditCopy.product_preferences)
      : auditCopy.product_preferences;
  }
  
  // Fix 3: Ensure insulation object exists in currentConditions
  if (!transformedAudit.currentConditions.insulation) {
    transformedAudit.currentConditions.insulation = {
      attic: 'unknown',
      walls: 'unknown',
      basement: 'unknown',
      floor: 'unknown'
    };
  }
  
  // Fix 4: Ensure heating and cooling system objects exist
  if (!transformedAudit.heatingCooling.heatingSystem) {
    transformedAudit.heatingCooling.heatingSystem = {
      type: 'unknown',
      fuel: 'unknown',
      age: 0,
      efficiency: 0
    };
  }
  
  if (!transformedAudit.heatingCooling.coolingSystem) {
    transformedAudit.heatingCooling.coolingSystem = {
      type: 'unknown',
      age: 0,
      efficiency: 0
    };
  }
  
  // Debugging output
  console.log('Transformed audit data keys:', Object.keys(transformedAudit));
  
  return transformedAudit;
}

/**
 * This function simulates the ReportGenerationService.generateReport function 
 * but with additional validation to identify issues
 */
async function debugReportGeneration(auditData, recommendations) {
  console.log('\n--- Starting PDF report generation debug ---');
  
  // Validate audit data
  if (!auditData) {
    console.error('ERROR: Audit data is undefined or null');
    return;
  }
  
  // Validate required sections
  const requiredSections = ['basicInfo', 'homeDetails', 'currentConditions', 'heatingCooling', 'energyConsumption'];
  const missingSections = requiredSections.filter(section => !auditData[section]);
  
  if (missingSections.length > 0) {
    console.error(`ERROR: Missing required audit data sections: ${missingSections.join(', ')}`);
    return;
  }
  
  // Validate specific required fields
  const validationIssues = [];
  
  if (!auditData.basicInfo.propertyType) validationIssues.push('basicInfo.propertyType is missing');
  if (!auditData.homeDetails.squareFootage) validationIssues.push('homeDetails.squareFootage is missing');
  if (!auditData.currentConditions.insulation) validationIssues.push('currentConditions.insulation is missing');
  if (!auditData.heatingCooling.heatingSystem) validationIssues.push('heatingCooling.heatingSystem is missing');
  if (!auditData.energyConsumption.electricBill) validationIssues.push('energyConsumption.electricBill is missing');
  
  if (validationIssues.length > 0) {
    console.error('ERROR: Validation issues found:');
    validationIssues.forEach(issue => console.error(` - ${issue}`));
    return;
  }
  
  // Validate recommendations
  if (!recommendations || !Array.isArray(recommendations)) {
    console.error('ERROR: Recommendations must be an array');
    return;
  }
  
  // All validations passed
  console.log('SUCCESS: Audit data and recommendations valid for PDF generation');
  console.log('Audit data properties:');
  for (const section of requiredSections) {
    console.log(` - ${section}: ${Object.keys(auditData[section]).join(', ')}`);
  }
  
  console.log(`Recommendations count: ${recommendations.length}`);
  console.log('--- End of PDF report generation debug ---\n');
  
  return true;
}

async function main() {
  try {
    console.log('\n=== PDF Report Generation Fix Tool ===\n');
    
    console.log('Step 1: Testing audit data transformation...');
    const transformedAudit = transformAuditData(testAudit);
    
    console.log('\nStep 2: Running validation checks...');
    const isValid = await debugReportGeneration(transformedAudit, testRecommendations);
    
    if (isValid) {
      console.log('\nPotential fixes to implement in energyAudit.ts:');
      console.log('1. Ensure all required audit data sections exist and have proper defaults');
      console.log('2. Handle both snake_case and camelCase property names consistently');
      console.log('3. Add validation for nested objects like insulation and heating/cooling systems');
      console.log('4. Verify type conversions for string-encoded JSON data');
      
      // Suggestion for fixing energyAudit.ts
      console.log('\nImplement the enhanced transformation function in energyAudit.ts route:');
      console.log('```typescript');
      console.log(`// Enhanced transformation with validation
const transformedAudit: EnergyAuditData = {
  basicInfo: typeof audit.basic_info === 'string' 
    ? JSON.parse(audit.basic_info) 
    : (audit.basic_info || {}),
    
  homeDetails: typeof audit.home_details === 'string' 
    ? JSON.parse(audit.home_details) 
    : (audit.home_details || {}),
    
  currentConditions: typeof audit.current_conditions === 'string' 
    ? JSON.parse(audit.current_conditions) 
    : (audit.current_conditions || {}),
    
  heatingCooling: typeof audit.heating_cooling === 'string' 
    ? JSON.parse(audit.heating_cooling) 
    : (audit.heating_cooling || {}),
    
  energyConsumption: typeof audit.energy_consumption === 'string' 
    ? JSON.parse(audit.energy_consumption) 
    : (audit.energy_consumption || {})
};

// Ensure required nested objects exist
if (!transformedAudit.currentConditions.insulation) {
  transformedAudit.currentConditions.insulation = {
    attic: 'unknown',
    walls: 'unknown',
    basement: 'unknown',
    floor: 'unknown'
  };
}

// Add product preferences if they exist
if (audit.product_preferences) {
  transformedAudit.productPreferences = typeof audit.product_preferences === 'string'
    ? JSON.parse(audit.product_preferences)
    : audit.product_preferences;
}
`);
      console.log('```');
    }
  } catch (error) {
    console.error('Error in fix tool:', error);
  }
}

// Run the tool
main();
