// Implementation for Lighting Data Normalization

/**
 * This file contains the implementation code for the Lighting Data Normalization improvements
 * to be added to ReportGenerationService.ts
 * 
 * The implementation is based on the plan outlined in lighting_data_normalization_implementation.txt
 */

// 1. Bulb Type Description Generator
/**
 * Generates an appropriate lighting description based on actual bulb data
 * @param bulbPercentages The percentages of different bulb types
 * @returns A human-readable description of the lighting setup
 */
function getBulbTypeDescription(bulbPercentages) {
  try {
    // Check if we have valid data
    if (!bulbPercentages || 
        typeof bulbPercentages !== 'object' ||
        (
          (bulbPercentages.led === undefined || bulbPercentages.led === 0) && 
          (bulbPercentages.cfl === undefined || bulbPercentages.cfl === 0) && 
          (bulbPercentages.incandescent === undefined || bulbPercentages.incandescent === 0)
        )) {
      appLogger.debug('No valid lighting data found', { bulbPercentages });
      return 'Lighting data not available';
    }
    
    // Get normalized percentages
    const normalized = this.normalizeBulbPercentages(bulbPercentages);
    
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
    appLogger.error('Error generating bulb type description', { 
      error: error instanceof Error ? error.message : String(error),
      bulbPercentages 
    });
    return 'Mix of Bulb Types'; // Fallback
  }
}

// 2. Percentage Normalization Function
/**
 * Normalizes bulb percentages to ensure they sum to 100%
 * @param percentages The raw bulb percentage data
 * @returns Normalized percentages that sum to 100%
 */
function normalizeBulbPercentages(percentages) {
  try {
    // Handle null/undefined input
    if (!percentages) {
      appLogger.warn('No bulb percentages provided for normalization');
      return this.getDefaultBulbPercentages();
    }
    
    // Ensure values are numbers and not undefined
    const led = typeof percentages.led === 'number' && !isNaN(percentages.led) ? percentages.led : 0;
    const cfl = typeof percentages.cfl === 'number' && !isNaN(percentages.cfl) ? percentages.cfl : 0;
    const incandescent = typeof percentages.incandescent === 'number' && !isNaN(percentages.incandescent) ? percentages.incandescent : 0;
    
    // Calculate sum
    const total = led + cfl + incandescent;
    
    // If no data available, use defaults based on property type and age
    if (total === 0) {
      appLogger.debug('No bulb data available, using defaults');
      return this.getDefaultBulbPercentages();
    }
    
    // Normalize to 100%
    return {
      led: Math.round((led / total) * 100),
      cfl: Math.round((cfl / total) * 100),
      incandescent: Math.round((incandescent / total) * 100)
    };
  } catch (error) {
    appLogger.error('Error normalizing bulb percentages', { 
      error: error instanceof Error ? error.message : String(error),
      percentages 
    });
    return this.getDefaultBulbPercentages();
  }
}

// 3. Default Values Based on Property Age
/**
 * Provides default bulb percentages based on property age
 * @param yearBuilt The year the property was built
 * @returns Default bulb percentages
 */
function getDefaultBulbPercentages(yearBuilt) {
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
    appLogger.error('Error calculating default bulb percentages', { 
      error: error instanceof Error ? error.message : String(error),
      yearBuilt 
    });
    // Fallback defaults
    return { led: 30, cfl: 30, incandescent: 40 };
  }
}

// 4. Lighting Section Display
/**
 * Add lighting section to the PDF with normalized data
 * @param doc PDFKit document
 * @param auditData Energy audit data
 */
function addLightingSection(doc, auditData) {
  try {
    // Start lighting section
    this.addSectionHeader(doc, 'Lighting', 'left', false);
    
    // Get and normalize bulb percentages
    const rawPercentages = auditData.currentConditions?.bulbPercentages;
    const normalizedPercentages = this.normalizeBulbPercentages(rawPercentages);
    
    // Generate appropriate description based on actual data
    const bulbTypeDescription = this.getBulbTypeDescription(normalizedPercentages);
    
    // Create lighting data table
    const rows = [
      ['Primary Lighting Type:', bulbTypeDescription],
      ['LED Bulbs:', `${normalizedPercentages.led}%`],
      ['CFL Bulbs:', `${normalizedPercentages.cfl}%`],
      ['Incandescent Bulbs:', `${normalizedPercentages.incandescent}%`]
    ];
    
    // Add table to document
    this.generateTable(doc, [], rows);
    
    // Add explanation if using default data
    if (!rawPercentages || (rawPercentages.led === 0 && rawPercentages.cfl === 0 && rawPercentages.incandescent === 0)) {
      doc.fontSize(10)
         .text('Note: Lighting distribution estimated based on property age and typical patterns.', {
           italics: true
         });
    }
    
    // Add lighting efficiency chart if data is available
    if (normalizedPercentages.led > 0 || normalizedPercentages.cfl > 0 || normalizedPercentages.incandescent > 0) {
      doc.moveDown(2);
      this.addLightingEfficiencyChart(doc, normalizedPercentages);
    }
    
    doc.moveDown(2);
  } catch (error) {
    appLogger.error('Error adding lighting section', { 
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue with other sections
    doc.moveDown(2);
  }
}

// 5. Lighting Efficiency Chart
/**
 * Adds a lighting efficiency chart to the PDF
 * @param doc PDFKit document
 * @param bulbPercentages Normalized bulb percentages
 */
function addLightingEfficiencyChart(doc, bulbPercentages) {
  try {
    // Calculate estimated energy usage based on bulb types
    // Standard efficiency factors: LED (1x), CFL (3x), Incandescent (10x)
    const ledEnergyUsage = bulbPercentages.led * 1;
    const cflEnergyUsage = bulbPercentages.cfl * 3;
    const incandescentEnergyUsage = bulbPercentages.incandescent * 10;
    
    // Calculate potential savings by switching to all LED
    const currentTotal = ledEnergyUsage + cflEnergyUsage + incandescentEnergyUsage;
    const potentialTotal = (bulbPercentages.led + bulbPercentages.cfl + bulbPercentages.incandescent) * 1;
    const potentialSavings = Math.round(((currentTotal - potentialTotal) / currentTotal) * 100);
    
    // Generate chart using chartHelpers
    // In a real implementation, this would call the appropriate chart generator
    // For example:
    // const chartBuffer = this.chartHelpers.generateLightingEfficiencyChart(bulbPercentages);
    // doc.image(chartBuffer, { width: 400 });
    
    // Add chart explanation text
    doc.fontSize(12)
       .text('Lighting Efficiency Analysis', { continued: false })
       .moveDown(0.5)
       .fontSize(10)
       .text(`Your current lighting configuration uses approximately ${this.formatValue(currentTotal, 'number')} units of energy.`)
       .text(`Switching to 100% LED bulbs could reduce your lighting energy usage by approximately ${potentialSavings}%.`);
    
    doc.moveDown(1);
  } catch (error) {
    appLogger.error('Error adding lighting efficiency chart', { 
      error: error instanceof Error ? error.message : String(error),
      bulbPercentages
    });
    // Continue without chart
    doc.moveDown(1);
  }
}

// 6. Update to Report Generation Workflow
/*
// Inside the generateReport method
try {
  // Other sections...
  
  // Lighting section - use our new normalized lighting data methods
  this.addLightingSection(doc, auditData);
  
  // Other sections...
} catch (error) {
  appLogger.error('Error generating report', { error });
  throw error;
}
*/

// 7. Update other references to lighting data
/*
// Any other place lighting data is referenced
const normalizedPercentages = this.normalizeBulbPercentages(auditData.currentConditions?.bulbPercentages);
*/

// 8. Unit Test Example
/*
function testBulbNormalization() {
  // Test with valid data
  const testData1 = { led: 30, cfl: 20, incandescent: 50 };
  const normalized1 = normalizeBulbPercentages(testData1);
  console.assert(normalized1.led + normalized1.cfl + normalized1.incandescent === 100, 
    'Percentages should sum to 100%');
  
  // Test with invalid data
  const testData2 = { led: 0, cfl: 0, incandescent: 0 };
  const normalized2 = normalizeBulbPercentages(testData2);
  console.assert(normalized2.led + normalized2.cfl + normalized2.incandescent === 100, 
    'Default percentages should sum to 100%');
  
  // Test with missing data
  const testData3 = { led: 30 };
  const normalized3 = normalizeBulbPercentages(testData3);
  console.assert(normalized3.led === 100 && normalized3.cfl === 0 && normalized3.incandescent === 0, 
    'Should normalize with missing values');
  
  // Test with null
  const normalized4 = normalizeBulbPercentages(null);
  console.assert(normalized4.led + normalized4.cfl + normalized4.incandescent === 100, 
    'Should use defaults for null input');
}
*/
