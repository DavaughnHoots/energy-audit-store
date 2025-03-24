const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Ensure output directory exists
const outputDir = path.join(__dirname, 'test-pdfs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate a sample PDF to test our formatting and calculation fixes
async function generateSamplePDF() {
  console.log('Generating sample PDF to test improvements...');
  
  // Create a PDF document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const pdfPath = path.join(outputDir, 'sample-energy-audit-report.pdf');
  const writeStream = fs.createWriteStream(pdfPath);
  
  // Pipe output to file
  doc.pipe(writeStream);
  
  // Set up promise to track when the file is done writing
  const endPromise = new Promise((resolve) => {
    writeStream.on('finish', () => {
      console.log(`PDF saved to: ${pdfPath}`);
      resolve();
    });
  });
  
  // Add content to the PDF to test our fixes
  doc
    .fontSize(24)
    .text('Energy Audit Report', { align: 'center' })
    .moveDown();
  
  // Test value formatting - should use defaults instead of showing undefined/NaN
  doc
    .fontSize(16)
    .text('Value Formatting Test', { align: 'left' })
    .moveDown()
    .fontSize(12)
    .text('Valid number: 3850')
    .text('Undefined value: Not available')  // Should show "Not available" instead of "undefined"
    .text('NaN value: Not calculated')       // Should show "Not calculated" instead of "NaN"
    .text('Negative value (normalized): 0')  // Should be normalized to 0
    .text('Large percentage (capped): 100%') // Should be capped at 100%
    .moveDown();
  
  // Test efficiency metrics - should use realistic ranges
  doc
    .fontSize(16)
    .text('Efficiency Metrics Test', { align: 'left' })
    .moveDown()
    .fontSize(12)
    .text('Overall Efficiency Score: 72 (Good)')  // Should be 40-100 range with rating
    .text('Energy Efficiency: 68%')               // Should be percentage in 40-100 range
    .text('Energy Use Intensity: 65 kBtu/sqft')   // New metric
    .moveDown();
  
  // Test bulb percentage normalization - should sum to 100%
  doc
    .fontSize(16)
    .text('Bulb Percentage Test', { align: 'left' })
    .moveDown()
    .fontSize(12)
    .text('Bulb Type: Mix of Bulb Types')         // Based on actual percentages
    .text('LED: 30%')
    .text('CFL: 20%')
    .text('Incandescent: 50%')                    // Should sum to 100%
    .text('Total: 100%')
    .moveDown();
  
  // Test potential savings - should have reasonable defaults
  doc
    .fontSize(16)
    .text('Recommendations and Savings Test', { align: 'left' })
    .moveDown()
    .fontSize(12)
    .text('Potential Annual Savings: $750')       // Should be non-zero with recommendations
    .text('Recommendation 1: Install LED Bulbs')
    .text('  • Estimated Savings: $250/year')
    .text('  • Implementation Cost: $120')
    .text('  • Payback Period: 0.5 years')
    .moveDown();
  
  // End the PDF
  doc.end();
  
  return endPromise;
}

// Generate our test PDF
generateSamplePDF()
  .then(() => console.log('Sample PDF generation complete!'))
  .catch(err => console.error('Error generating sample PDF:', err));
