// Test script for Usage Figures Clarity improvements

/**
 * This script tests the improvements made to add better context and clarity 
 * to energy usage figures in the audit reports
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
  energyConsumption: {
    electricBill: 300, // Monthly electricity in kWh
    gasBill: 50, // Monthly gas in therms
    powerFactor: 0.92,
    seasonalFactor: 1.1,
    occupancyFactor: 0.85,
    durationHours: 12
  },
  heatingCooling: {
    heatingSystem: {
      type: 'furnace',
      efficiency: 80,
      age: 10,
      targetEfficiency: 95
    }
  },
  currentConditions: {
    insulation: {
      attic: 'R-30'
    },
    windowType: 'Double pane',
    primaryBulbType: 'mixed',
    bulbPercentages: {
      led: 40,
      cfl: 30,
      incandescent: 30
    }
  }
};

/**
 * Test calculateEnergyUseIntensity method
 */
function testCalculateEnergyUseIntensity() {
  console.log('\n--- Testing Energy Use Intensity Calculation ---');
  
  // Mock the calculateTotalEnergy method
  const calculateTotalEnergy = (auditData) => {
    const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
    const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12;
    return electricKwhPerYear + gasKwhPerYear;
  };
  
  // Implementation from usage_figures_clarity_implementation.js
  const calculateEnergyUseIntensity = (auditData) => {
    try {
      const totalEnergy = calculateTotalEnergy(auditData);
      const squareFootage = auditData.homeDetails.squareFootage;
      
      if (squareFootage <= 0) {
        console.warn('Invalid square footage for EUI calculation', { squareFootage });
        return 0;
      }
      
      // Convert kWh to kBtu (1 kWh = 3.412 kBtu)
      const totalKbtu = totalEnergy * 3.412;
      
      // Calculate EUI (kBtu/sqft)
      const eui = totalKbtu / squareFootage;
      
      return eui;
    } catch (error) {
      console.error('Error calculating energy use intensity', error);
      return 0;
    }
  };
  
  // Calculate total energy
  const totalEnergy = calculateTotalEnergy(mockAuditData);
  console.log(`Total Energy: ${Math.round(totalEnergy)} kWh/year`);
  
  // Calculate EUI
  const eui = calculateEnergyUseIntensity(mockAuditData);
  console.log(`Energy Use Intensity: ${eui.toFixed(2)} kBtu/sqft`);
  
  // Calculate average EUI for the property type
  const getAverageEui = (propertyType) => {
    const averageEuiByType = {
      'single-family': 45.0,
      'multi-family': 60.0,
      'apartment': 58.0,
      'condo': 52.0,
      'townhouse': 50.0,
      'mobile-home': 70.0,
      'commercial': 80.0
    };
    
    return averageEuiByType[propertyType.toLowerCase()] || 55.0;
  };
  
  const avgEui = getAverageEui(mockAuditData.basicInfo.propertyType);
  console.log(`Average EUI for ${mockAuditData.basicInfo.propertyType}: ${avgEui.toFixed(2)} kBtu/sqft`);
  
  // Calculate comparison
  const euiComparison = (eui / avgEui) * 100 - 100;
  
  // Test formatComparisonText
  const formatComparisonText = (percentDifference) => {
    if (Math.abs(percentDifference) < 5) {
      return "Average for similar properties (within 5%)";
    } else if (percentDifference < 0) {
      return `${Math.abs(percentDifference).toFixed(1)}% better than average`;
    } else {
      return `${percentDifference.toFixed(1)}% higher than average`;
    }
  };
  
  console.log(`EUI Comparison: ${formatComparisonText(euiComparison)}`);
}

/**
 * Test precision formatting improvements
 */
function testNumberFormatting() {
  console.log('\n--- Testing Improved Number Formatting ---');
  
  const formatNumber = (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return 'N/A';
    }
    
    if (Math.abs(value) >= 10000) {
      // No decimal places for very large numbers
      return value.toLocaleString(undefined, {maximumFractionDigits: 0});
    } else if (Math.abs(value) >= 1000) {
      // At most 1 decimal place for large numbers
      return value.toLocaleString(undefined, {maximumFractionDigits: 1});
    } else if (Math.abs(value) >= 100) {
      // At most 1 decimal place for medium numbers
      return value.toLocaleString(undefined, {maximumFractionDigits: 1});
    } else {
      // More precision for smaller numbers
      return value.toLocaleString(undefined, {maximumFractionDigits: 2});
    }
  };
  
  console.log('Original: 38760.0000, Formatted: ' + formatNumber(38760.0000));
  console.log('Original: 1234.5678, Formatted: ' + formatNumber(1234.5678));
  console.log('Original: 456.7890, Formatted: ' + formatNumber(456.7890));
  console.log('Original: 45.6789, Formatted: ' + formatNumber(45.6789));
}

/**
 * Test energy consumption display improvements
 */
function testEnergyConsumptionDisplay() {
  console.log('\n--- Testing Energy Consumption Display ---');
  
  // Mock formatting function
  const formatValue = (value, type) => {
    if (type === 'number') {
      if (typeof value !== 'number' || isNaN(value)) {
        return 'N/A';
      }
      
      if (Math.abs(value) >= 10000) {
        return value.toLocaleString(undefined, {maximumFractionDigits: 0});
      } else if (Math.abs(value) >= 1000) {
        return value.toLocaleString(undefined, {maximumFractionDigits: 1});
      } else if (Math.abs(value) >= 100) {
        return value.toLocaleString(undefined, {maximumFractionDigits: 1});
      } else {
        return value.toLocaleString(undefined, {maximumFractionDigits: 2});
      }
    } else if (type === 'percentage') {
      return value % 1 === 0 ? `${value}%` : `${value.toFixed(1)}%`;
    }
    return value.toString();
  };
  
  // Calculate values
  const electricKwhPerYear = mockAuditData.energyConsumption.electricBill * 12;
  const gasKwhPerYear = mockAuditData.energyConsumption.gasBill * 29.3 * 12;
  const totalKwh = electricKwhPerYear + gasKwhPerYear;
  
  console.log('Energy Consumption Summary:');
  console.log(`- Total Annual Energy: ${formatValue(totalKwh, 'number')} kWh`);
  console.log(`- Electricity: ${formatValue(electricKwhPerYear, 'number')} kWh/year (${formatValue((electricKwhPerYear / totalKwh) * 100, 'percentage')} of total)`);
  console.log(`- Natural Gas: ${formatValue(mockAuditData.energyConsumption.gasBill * 12, 'number')} therms/year (equivalent to ${formatValue(gasKwhPerYear, 'number')} kWh)`);
  
  // Display energy factors with explanations
  if (mockAuditData.energyConsumption.powerFactor !== undefined) {
    const powerFactor = mockAuditData.energyConsumption.powerFactor;
    const powerFactorQuality = 
      powerFactor >= 0.95 ? 'Excellent' :
      powerFactor >= 0.90 ? 'Good' :
      powerFactor >= 0.85 ? 'Average' : 'Below average';
    
    console.log(`\nPower Factor: ${powerFactor.toFixed(2)} (${powerFactorQuality} - typical range: 0.80-0.95)`);
    console.log(`  Power factor measures the efficiency of electrical equipment in using power. Higher values indicate more efficient use of electricity.`);
  }
  
  if (mockAuditData.energyConsumption.seasonalFactor !== undefined) {
    console.log(`\nSeasonal Factor: ${mockAuditData.energyConsumption.seasonalFactor.toFixed(2)}`);
    console.log(`  Seasonal factor adjusts energy usage based on climate patterns throughout the year. Values above 1.0 indicate higher seasonal variation.`);
  }
}

/**
 * Run all tests
 */
function runTests() {
  console.log('=== Usage Figures Clarity Improvements Test ===');
  testCalculateEnergyUseIntensity();
  testNumberFormatting();
  testEnergyConsumptionDisplay();
  console.log('\n=== Test Complete ===');
}

// Execute tests
runTests();
