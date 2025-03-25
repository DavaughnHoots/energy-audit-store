const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { ReportValidationHelper } = require('./backend/src/utils/reportValidationHelper.js');

// Ensure output directory exists
const outputDir = path.join(__dirname, 'test-pdfs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Test data with problematic values
const testRecommendations = [
  {
    id: 'rec-001',
    title: 'Install LED Bulbs',
    description: 'Replace all incandescent bulbs with LED alternatives to reduce electricity usage.',
    priority: 'high',
    status: 'active',
    estimatedSavings: 250,  // Valid value
    estimatedCost: 120,     // Valid value
    paybackPeriod: 0.5,     // Valid value
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: '2025-03-24'
  },
  {
    id: 'rec-002',
    title: 'HVAC System Upgrade',
    description: 'Replace the current HVAC system with a high-efficiency model.',
    priority: 'high',
    status: 'active',
    estimatedSavings: undefined,  // Invalid - should use default for HVAC
    estimatedCost: NaN,           // Invalid - should use default for HVAC
    paybackPeriod: null,          // Invalid - should calculate from defaults or use category default
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: '2025-03-24'
  },
  {
    id: 'rec-003',
    title: 'Add Weather Stripping',
    description: 'Seal gaps around doors and windows to prevent drafts.',
    priority: 'medium',
    status: 'active',
    estimatedSavings: NaN,        // Invalid - should use default for air sealing
    estimatedCost: undefined,     // Invalid - should use default for air sealing
    paybackPeriod: undefined,     // Invalid - should calculate from defaults
    actualSavings: null,
    implementationDate: null,
    implementationCost: null,
    lastUpdate: '2025-03-24'
  }
];

// Test our validation helper
async function testRecommendationValidation() {
  console.log('Testing recommendation validation...');
  
  // Validate the recommendations
  const validatedRecommendations = ReportValidationHelper.validateRecommendations(testRecommendations);
  
  console.log('\nOriginal recommendations:');
  testRecommendations.forEach(rec => {
    console.log(`- ${rec.title}: $${rec.estimatedSavings} savings, $${rec.estimatedCost} cost, ${rec.paybackPeriod} years payback`);
  });
  
  console.log('\nValidated recommendations:');
  validatedRecommendations.forEach(rec => {
    console.log(`- ${rec.title}: $${rec.estimatedSavings} savings, $${rec.estimatedCost} cost, ${rec.paybackPeriod.toFixed(1)} years payback`);
  });
  
  // Create a PDF to visualize the results
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const pdfPath = path.join(outputDir, 'recommendation-validation-test.pdf');
  doc.pipe(fs.createWriteStream(pdfPath));
  
  // Add header
  doc
    .fontSize(24)
    .text('Recommendation Validation Test', { align: 'center' })
    .moveDown();
  
  // Add explanation
  doc
    .fontSize(12)
    .text('This test validates that recommendations with invalid financial data are properly fixed with sensible defaults.', { align: 'left' })
    .moveDown(2);
  
  // Show original recommendations
  doc
    .fontSize(16)
    .text('Original Recommendations', { align: 'left' })
    .moveDown();
  
  testRecommendations.forEach(rec => {
    doc
      .fontSize(14)
      .text(rec.title, { align: 'left' })
      .fontSize(12)
      .text(rec.description, { align: 'left' })
      .text(`Estimated Savings: ${rec.estimatedSavings === undefined ? 'undefined' : rec.estimatedSavings === null ? 'null' : isNaN(rec.estimatedSavings) ? 'NaN' : '$' + rec.estimatedSavings}/year`, { align: 'left' })
      .text(`Implementation Cost: ${rec.estimatedCost === undefined ? 'undefined' : rec.estimatedCost === null ? 'null' : isNaN(rec.estimatedCost) ? 'NaN' : '$' + rec.estimatedCost}`, { align: 'left' })
      .text(`Payback Period: ${rec.paybackPeriod === undefined ? 'undefined' : rec.paybackPeriod === null ? 'null' : isNaN(rec.paybackPeriod) ? 'NaN' : rec.paybackPeriod + ' years'}`, { align: 'left' })
      .moveDown(1);
  });
  
  // Add page break
  doc.addPage();
  
  // Show validated recommendations
  doc
    .fontSize(16)
    .text('Validated Recommendations', { align: 'left' })
    .moveDown();
  
  validatedRecommendations.forEach(rec => {
    doc
      .fontSize(14)
      .text(rec.title, { align: 'left' })
      .fontSize(12)
      .text(rec.description, { align: 'left' })
      .text(`Estimated Savings: $${rec.estimatedSavings}/year`, { align: 'left' })
      .text(`Implementation Cost: $${rec.estimatedCost}`, { align: 'left' })
      .text(`Payback Period: ${rec.paybackPeriod.toFixed(1)} years`, { align: 'left' })
      .moveDown(1);
  });
  
  // End the document
  doc.end();
  
  console.log(`\nTest PDF saved to: ${pdfPath}`);
  console.log('Recommendation validation test complete!');
}

// Run the test
testRecommendationValidation()
  .then(() => console.log('All tests completed successfully!'))
  .catch(err => console.error('Error in tests:', err));
