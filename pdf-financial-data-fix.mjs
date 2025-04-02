/**
 * Test script for financial data fixes in PDF reports
 * 
 * This script tests the enhanced recommendation data processing by 
 * simulating recommendations with missing or invalid financial data
 * to ensure our fixes are properly handling these cases.
 */

// Import required modules
import PDFDocument from 'pdfkit';
import fs from 'fs';

/**
 * Functions to format financial data properly
 */
function formatCurrency(value, suffix = '') {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return `$0${suffix}`;
  }
  
  const numValue = typeof value === 'number' ? value : Number(value);
  
  // Format based on value size
  if (Math.abs(numValue) >= 1000) {
    return `$${numValue.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`;
  } else if (Math.abs(numValue) >= 100) {
    return `$${numValue.toFixed(0)}${suffix}`;
  } else if (numValue === 0) {
    return `$0${suffix}`;
  } else {
    return `$${numValue.toFixed(2)}${suffix}`;
  }
}

function formatRecommendationYears(years) {
  if (years === null || years === undefined || isNaN(Number(years))) {
    return '2-5 years (estimated)';
  }
  
  const numYears = Number(years);
  
  if (numYears <= 0) {
    return 'Immediate payback';
  }
  
  if (numYears < 1) {
    return `${Math.round(numYears * 12)} months`;
  } else if (numYears < 10) {
    return `${numYears.toFixed(1)} years`;
  } else {
    return `${Math.round(numYears)} years`;
  }
}

function formatCapacity(value, unit) {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return `standard capacity ${unit}`;
  }
  
  const numValue = Number(value);
  
  if (numValue === 0) {
    return `standard capacity ${unit}`;
  }
  
  if (Math.abs(numValue) >= 1000) {
    return `${Math.round(numValue).toLocaleString()} ${unit}`;
  } else if (Math.abs(numValue) >= 100) {
    return `${Math.round(numValue)} ${unit}`;
  } else {
    return `${numValue.toFixed(1)} ${unit}`;
  }
}

/**
 * Process recommendations to ensure valid financial data
 */
function processRecommendations(recommendations) {
  return recommendations.map(rec => {
    // Create a safe copy with validated financial data
    const processedRec = { ...rec };
    
    // Ensure estimated savings is a valid number
    if (processedRec.estimatedSavings === undefined || 
        processedRec.estimatedSavings === null || 
        isNaN(Number(processedRec.estimatedSavings))) {
      processedRec.estimatedSavings = generateEstimatedSavings(rec);
    }
    
    // Ensure estimated cost is a valid number
    if (processedRec.estimatedCost === undefined || 
        processedRec.estimatedCost === null || 
        isNaN(Number(processedRec.estimatedCost))) {
      processedRec.estimatedCost = generateEstimatedCost(rec);
    }
    
    // Calculate payback period if not provided
    if (processedRec.paybackPeriod === undefined || 
        processedRec.paybackPeriod === null || 
        isNaN(Number(processedRec.paybackPeriod))) {
      if (processedRec.estimatedSavings > 0) {
        processedRec.paybackPeriod = processedRec.estimatedCost / processedRec.estimatedSavings;
      } else {
        // Default payback period if we can't calculate
        processedRec.paybackPeriod = 3.5;
      }
    }
    
    // Special case for dehumidification capacity
    if (rec.title.toLowerCase().includes('dehumidification')) {
      // Ensure capacity has a valid value
      if (!rec.capacity || isNaN(Number(rec.capacity))) {
        processedRec.capacity = 45; // Standard size dehumidifier (pints/day)
      }
    }
    
    return processedRec;
  });
}

/**
 * Generate reasonable financial estimates based on recommendation type
 */
function generateEstimatedSavings(rec) {
  const title = rec.title.toLowerCase();
  
  if (title.includes('hvac')) return 450;
  if (title.includes('insulation')) return 350;
  if (title.includes('light') || title.includes('fixture')) return 200;
  if (title.includes('window')) return 300;
  if (title.includes('dehumidification')) return 180;
  
  return 225; // Default for other types
}

function generateEstimatedCost(rec) {
  const title = rec.title.toLowerCase();
  
  if (title.includes('hvac')) return 3500;
  if (title.includes('insulation')) return 1200;
  if (title.includes('light') || title.includes('fixture')) return 350;
  if (title.includes('window')) return 2500;
  if (title.includes('dehumidification')) return 750;
  
  return 800; // Default for other types
}

/**
 * Test recommendations with missing data
 */
const testRecommendations = [
  {
    id: '1',
    title: 'HVAC System Upgrade Required',
    description: 'Current system operating below optimal efficiency',
    type: 'hvac',
    priority: 'high',
    status: 'active',
    estimatedSavings: null, // Missing savings
    estimatedCost: undefined, // Missing cost
    paybackPeriod: NaN, // Invalid payback
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: '2025-04-01'
  },
  {
    id: '2',
    title: 'Replace Inefficient Fixtures',
    description: 'Replace inefficient fixtures: Living Room, Kitchen, Bedroom',
    type: 'lighting',
    priority: 'medium',
    status: 'active',
    estimatedSavings: undefined, // Missing savings
    estimatedCost: null, // Missing cost
    paybackPeriod: null, // Missing payback
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: '2025-04-01'
  },
  {
    id: '3',
    title: 'Lighting System Upgrade',
    description: 'Upgrade to more efficient lighting systems',
    type: 'lighting',
    priority: 'medium',
    status: 'active',
    estimatedSavings: 'unparseable', // Invalid format
    estimatedCost: 'bad-data', // Invalid format
    paybackPeriod: 'not-a-number', // Invalid format
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: '2025-04-01'
  },
  {
    id: '4',
    title: 'Install Dehumidification System',
    description: 'Install dehumidification system',
    type: 'humidity',
    priority: 'medium',
    status: 'active',
    estimatedSavings: 180,
    estimatedCost: 750,
    paybackPeriod: 4.2,
    capacity: NaN, // Invalid capacity
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: '2025-04-01'
  }
];

/**
 * Run the test and generate a sample PDF
 */
function runTest() {
  console.log('Starting financial data fix test...');

  // Process recommendations
  const processedRecs = processRecommendations(testRecommendations);
  
  console.log('Original vs Processed Recommendations:');
  for (let i = 0; i < testRecommendations.length; i++) {
    console.log('--------------------------------------------');
    console.log(`Recommendation #${i+1}: ${testRecommendations[i].title}`);
    console.log('ORIGINAL:');
    console.log(`- Estimated Savings: ${testRecommendations[i].estimatedSavings}`);
    console.log(`- Implementation Cost: ${testRecommendations[i].estimatedCost}`);
    console.log(`- Payback Period: ${testRecommendations[i].paybackPeriod}`);
    if (testRecommendations[i].capacity !== undefined) {
      console.log(`- Capacity: ${testRecommendations[i].capacity}`);
    }
    
    console.log('PROCESSED:');
    console.log(`- Estimated Savings: ${processedRecs[i].estimatedSavings} (${formatCurrency(processedRecs[i].estimatedSavings, '/year')})`);
    console.log(`- Implementation Cost: ${processedRecs[i].estimatedCost} (${formatCurrency(processedRecs[i].estimatedCost)})`);
    console.log(`- Payback Period: ${processedRecs[i].paybackPeriod} (${formatRecommendationYears(processedRecs[i].paybackPeriod)})`);
    if (processedRecs[i].capacity !== undefined) {
      console.log(`- Capacity: ${processedRecs[i].capacity} (${formatCapacity(processedRecs[i].capacity, 'pints/day')})`);
    }
  }
  
  // Generate a sample PDF to test formatting
  generateSamplePDF(processedRecs);
  
  console.log('\nTest completed. Sample PDF generated as "financial-data-fix-test.pdf"');
}

/**
 * Generate a simple PDF with the recommendations
 */
function generateSamplePDF(recommendations) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const buffers = [];
  
  doc.on('data', buffer => buffers.push(buffer));
  
  // Header
  doc
    .fontSize(24)
    .text('Financial Data Fix Test', { align: 'center' })
    .moveDown();
  
  // Recommendations
  doc
    .fontSize(16)
    .text('Recommendations', { align: 'left' })
    .moveDown();
  
  recommendations.forEach(rec => {
    doc
      .fontSize(14)
      .text(rec.title)
      .fontSize(12)
      .text(rec.description)
      .moveDown(0.5);
    
    doc
      .fontSize(12)
      .text(`Estimated Savings: ${formatCurrency(rec.estimatedSavings, '/year')}`)
      .text(`Implementation Cost: ${formatCurrency(rec.estimatedCost)}`)
      .text(`Payback Period: ${formatRecommendationYears(rec.paybackPeriod)}`);
    
    if (rec.title.toLowerCase().includes('dehumidification')) {
      doc.text(`Capacity: ${formatCapacity(rec.capacity, 'pints/day')}`);
    }
    
    doc.moveDown();
  });
  
  // Save the PDF
  doc.end();
  
  const pdfData = Buffer.concat(buffers);
  fs.writeFileSync('financial-data-fix-test.pdf', pdfData);
}

// Run the test
runTest();
