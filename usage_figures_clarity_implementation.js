// Implementation for Usage Figures Clarity Improvements

/**
 * This file contains the implementation code for the Usage Figures Clarity improvements
 * to be added to ReportGenerationService.ts
 * 
 * The implementation is based on the plan outlined in usage_figures_clarity_implementation.txt
 */

// 1. Add Energy Use Intensity (EUI) Calculation
/**
 * Calculates the Energy Use Intensity for the property
 * @param auditData Energy audit data
 * @returns Energy Use Intensity in kBtu/sqft
 */
function calculateEnergyUseIntensity(auditData) {
  try {
    const totalEnergy = this.calculateTotalEnergy(auditData);
    const squareFootage = auditData.homeDetails.squareFootage;
    
    if (squareFootage <= 0) {
      appLogger.warn('Invalid square footage for EUI calculation', { squareFootage });
      return 0;
    }
    
    // Convert kWh to kBtu (1 kWh = 3.412 kBtu)
    const totalKbtu = totalEnergy * 3.412;
    
    // Calculate EUI (kBtu/sqft)
    const eui = totalKbtu / squareFootage;
    
    appLogger.debug('Energy Use Intensity calculation', {
      totalEnergy,
      squareFootage,
      totalKbtu,
      eui
    });
    
    return eui;
  } catch (error) {
    appLogger.error('Error calculating energy use intensity', { 
      error: error instanceof Error ? error.message : String(error)
    });
    return 0;
  }
}

// 2. Add Average EUI by Property Type Data
/**
 * Returns the average Energy Use Intensity (EUI) for a given property type
 * Based on U.S. Energy Information Administration (EIA) data
 * @param propertyType Type of property
 * @returns Average EUI in kBtu/sqft
 */
function getAverageEui(propertyType) {
  // Default values in kBtu/sqft based on U.S. Energy Information Administration (EIA) data
  const averageEuiByType = {
    'single-family': 45.0,
    'multi-family': 60.0,
    'apartment': 58.0,
    'condo': 52.0,
    'townhouse': 50.0,
    'mobile-home': 70.0,
    'commercial': 80.0
  };
  
  // Get average EUI or use weighted average if type not found
  return averageEuiByType[propertyType.toLowerCase()] || 55.0;
}

// 3. Format comparison text helper function
/**
 * Returns formatted comparison text based on percentage difference
 * @param percentDifference Percentage difference value
 * @returns Formatted comparison text
 */
function formatComparisonText(percentDifference) {
  if (Math.abs(percentDifference) < 5) {
    return "Average for similar properties (within 5%)";
  } else if (percentDifference < 0) {
    return `${Math.abs(percentDifference).toFixed(1)}% better than average`;
  } else {
    return `${percentDifference.toFixed(1)}% higher than average`;
  }
}

// 4. Add energy consumption details
/**
 * Adds detailed energy consumption information to the PDF
 * @param doc PDFKit document
 * @param auditData Energy audit data
 */
function addEnergyConsumption(doc, auditData) {
  try {
    appLogger.debug('Adding detailed energy consumption section');
    
    const electricKwhPerYear = auditData.energyConsumption.electricBill * 12;
    const gasKwhPerYear = auditData.energyConsumption.gasBill * 29.3 * 12; // Convert therms to kWh
    const totalKwh = electricKwhPerYear + gasKwhPerYear;
    
    // Energy Use Intensity calculation
    const eui = this.calculateEnergyUseIntensity(auditData);
    const averageEui = this.getAverageEui(auditData.basicInfo.propertyType);
    const euiDifference = eui - averageEui;
    const euiPercentDiff = averageEui > 0 ? (euiDifference / averageEui) * 100 : 0;
    
    // Add detailed consumption breakdown
    doc.fontSize(12)
      .text(`Your total energy consumption is ${this.formatValue(totalKwh, 'number')} kWh per year, which includes:`)
      .moveDown(0.3)
      .text(`• Electricity: ${this.formatValue(electricKwhPerYear, 'number')} kWh/year (${this.formatValue((electricKwhPerYear / totalKwh) * 100, 'percentage')} of total)`)
      .text(`• Natural Gas: ${this.formatValue(auditData.energyConsumption.gasBill * 12, 'number')} therms/year (equivalent to ${this.formatValue(gasKwhPerYear, 'number')} kWh)`)
      .moveDown(1);
    
    // Add Energy Use Intensity explanation
    doc.text('Energy Use Intensity (EUI) is a measure of energy use per square foot, used to compare buildings of different sizes:')
      .moveDown(0.3)
      .text(`• Your EUI: ${this.formatValue(eui, 'number')} kBtu/sqft`)
      .text(`• Average EUI for similar properties: ${this.formatValue(averageEui, 'number')} kBtu/sqft`)
      .text(`• Your property is ${Math.abs(euiPercentDiff).toFixed(1)}% ${euiPercentDiff > 0 ? 'higher' : 'lower'} than average`);
    
    doc.moveDown(1.5);
    
  } catch (error) {
    appLogger.error('Error adding detailed energy consumption section', { 
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue without detailed consumption
    doc.moveDown();
  }
}

// 5. Add energy conversion explanations
/**
 * Adds energy conversion explanations to the PDF
 * @param doc PDFKit document
 */
function addEnergyConversionExplanations(doc) {
  try {
    doc.fontSize(12)
      .text('Energy Conversion Explanations:', { continued: false })
      .moveDown(0.3)
      .fontSize(10)
      .text('• Natural gas is measured in therms, but converted to kWh for comparison (1 therm = 29.3 kWh)')
      .text('• Energy Use Intensity (EUI) is measured in kBtu/sqft (1 kWh = 3.412 kBtu)')
      .text('• kBtu stands for thousand British Thermal Units, a standard energy measurement')
      .moveDown(1);
    doc.fontSize(12); // Restore normal font size
  } catch (error) {
    appLogger.error('Error adding energy conversion explanations', { 
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue without explanations
    doc.moveDown();
  }
}

// 6. Add energy factor explanations
/**
 * Adds explanations for energy factors to the PDF
 * @param doc PDFKit document
 * @param auditData Energy audit data
 */
function addEnergyFactorExplanations(doc, auditData) {
  try {
    doc.fontSize(12)
      .text('Energy Adjustment Factors:', { continued: false })
      .moveDown(0.3);
      
    if (auditData.energyConsumption.powerFactor !== undefined) {
      const powerFactor = auditData.energyConsumption.powerFactor;
      const powerFactorQuality = 
        powerFactor >= 0.95 ? 'Excellent' :
        powerFactor >= 0.90 ? 'Good' :
        powerFactor >= 0.85 ? 'Average' : 'Below average';
      
      doc.text(`Power Factor: ${powerFactor.toFixed(2)} (${powerFactorQuality} - typical range: 0.80-0.95)`)
        .fontSize(10)
        .text('  Power factor measures the efficiency of electrical equipment in using power. Higher values indicate more efficient use of electricity.')
        .fontSize(12)
        .moveDown(0.3);
    }
    
    if (auditData.energyConsumption.seasonalFactor !== undefined) {
      doc.text(`Seasonal Factor: ${auditData.energyConsumption.seasonalFactor.toFixed(2)}`)
        .fontSize(10)
        .text('  Seasonal factor adjusts energy usage based on climate patterns throughout the year. Values above 1.0 indicate higher seasonal variation.')
        .fontSize(12)
        .moveDown(0.3);
    }
    
    if (auditData.energyConsumption.occupancyFactor !== undefined) {
      doc.text(`Occupancy Factor: ${auditData.energyConsumption.occupancyFactor.toFixed(2)}`)
        .fontSize(10)
        .text('  Occupancy factor adjusts energy usage based on how often the building is occupied. Values closer to 1.0 indicate more consistent occupancy.')
        .fontSize(12)
        .moveDown(0.3);
    }
    
    doc.moveDown(1);
  } catch (error) {
    appLogger.error('Error adding energy factor explanations', { 
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue without explanations
    doc.moveDown();
  }
}

// 7. Update formatValue method for better number formatting
// Note: This should be implemented as part of the formatValue method in ReportGenerationService.ts
/*
case 'number':
  if (typeof value === 'number') {
    // Use appropriate precision based on value magnitude
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
  }
  return value.toString();
*/

// 8. Update executive summary to include EUI information
// This should be added to the addExecutiveSummary method after calculating potentialSavings
/*
// Add EUI calculation
const eui = this.calculateEnergyUseIntensity(auditData);
const averageEui = this.getAverageEui(auditData.basicInfo.propertyType);
const euiComparison = eui > 0 && averageEui > 0 ? (eui / averageEui) * 100 - 100 : 0;

// Add to existing rows
rows.push(['Energy Use Intensity:', `${this.formatValue(eui, 'number')} kBtu/sqft`]);
rows.push(['Compared to Similar Properties:', this.formatComparisonText(euiComparison)]);
*/

// 9. Update Energy Usage Section
// This should be added to the Energy Usage section in generateReport method
/*
// Energy Usage - start on new page
try {
  appLogger.debug('Adding energy consumption section');
  this.addSectionHeader(doc, 'Energy Consumption', 'left', true, 0);
  
  const rows = [
    ['Average Monthly Electric:', `${auditData.energyConsumption.electricBill} kWh`],
    ['Average Monthly Gas:', `${auditData.energyConsumption.gasBill} therms`],
    ['Total Annual Energy:', `${this.formatValue(this.calculateTotalEnergy(auditData), 'number')} kWh`],
    ['Energy Use Intensity:', `${this.formatValue(this.calculateEnergyUseIntensity(auditData), 'number')} kBtu/sqft`]
  ];
  
  // Add new fields if they exist
  if (auditData.energyConsumption.durationHours !== undefined) {
    rows.push(['Daily Usage Hours:', `${auditData.energyConsumption.durationHours} hours`]);
  }
  
  if (auditData.energyConsumption.powerFactor !== undefined) {
    rows.push(['Power Factor:', auditData.energyConsumption.powerFactor.toFixed(2)]);
  }
  
  if (auditData.energyConsumption.seasonalFactor !== undefined) {
    rows.push(['Seasonal Factor:', auditData.energyConsumption.seasonalFactor.toFixed(2)]);
  }
  
  if (auditData.energyConsumption.occupancyFactor !== undefined) {
    rows.push(['Occupancy Factor:', auditData.energyConsumption.occupancyFactor.toFixed(2)]);
  }
  
  this.generateTable(doc, [], rows);
  doc.moveDown();
  
  // Add detailed explanations
  this.addEnergyConsumption(doc, auditData);
  this.addEnergyConversionExplanations(doc);
  
  // Add factor explanations if they exist
  if (auditData.energyConsumption.powerFactor !== undefined ||
      auditData.energyConsumption.seasonalFactor !== undefined ||
      auditData.energyConsumption.occupancyFactor !== undefined) {
    this.addEnergyFactorExplanations(doc, auditData);
  }
  
} catch (error) {
  appLogger.error('Error adding energy consumption section', { error });
  throw error;
}
*/
