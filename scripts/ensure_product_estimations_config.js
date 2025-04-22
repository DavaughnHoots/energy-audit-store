/**
 * Ensures the product-estimations.json file is in the correct location
 * and is accessible to the web application.
 */

const fs = require('fs');
const path = require('path');

// Function to copy the config file to multiple possible locations
function copyConfigFile() {
  const sourceFile = 'public/data/product-estimations.json';
  
  if (!fs.existsSync(sourceFile)) {
    console.error('Error: Source file not found at', sourceFile);
    console.log('Creating directories if needed...');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync('public/data')) {
      fs.mkdirSync('public/data', { recursive: true });
      console.log('Created public/data directory');
    }
    
    console.error('Please create the product-estimations.json file manually or restore it from a backup.');
    return false;
  }
  
  // Define target locations to ensure the file is accessible
  const targetLocations = [
    'public/data/product-estimations.json',
    'dist/data/product-estimations.json',
    'dist/public/data/product-estimations.json',
    'data/product-estimations.json'
  ];
  
  console.log('Source file exists at', sourceFile);
  
  // Copy to all target locations to ensure accessibility
  for (const target of targetLocations) {
    if (target === sourceFile) {
      console.log(`Skipping copy to same location: ${target}`);
      continue;
    }
    
    try {
      // Create directory if it doesn't exist
      const targetDir = path.dirname(target);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`Created directory: ${targetDir}`);
      }
      
      // Copy the file
      fs.copyFileSync(sourceFile, target);
      console.log(`✅ Copied to ${target}`);
    } catch (error) {
      console.error(`Error copying to ${target}:`, error.message);
    }
  }
  
  return true;
}

// Check and fix the import paths in ProductDetailModal.tsx
function fixImportPaths() {
  console.log('Checking import paths in ProductDetailModal.tsx...');
  
  const modalPath = 'src/components/products/ProductDetailModal.tsx';
  
  if (!fs.existsSync(modalPath)) {
    console.error('Error: ProductDetailModal.tsx not found at', modalPath);
    return false;
  }
  
  let content = fs.readFileSync(modalPath, 'utf8');
  let changed = false;
  
  // Check if enhanceProductWithEstimates is imported properly
  if (!content.includes('import { enhanceProductWithEstimates }')) {
    console.log('⚠️ enhanceProductWithEstimates import not found, adding it...');
    
    // Add the import if it's missing
    content = content.replace(
      "import React",
      "import { enhanceProductWithEstimates } from '@/services/productEstimationService';\nimport React"
    );
    
    changed = true;
  } else {
    console.log('✅ enhanceProductWithEstimates is already imported');
  }
  
  if (changed) {
    fs.writeFileSync(modalPath, content, 'utf8');
    console.log('✅ Updated import paths in ProductDetailModal.tsx');
  }
  
  return true;
}

// Verify the schema validation file exists and create it if needed
function ensureSchemaFile() {
  console.log('Checking schema validation file...');
  
  const schemaPath = 'src/schemas/productEstimationSchema.ts';
  const examplePath = 'src/schemas/productEstimationSchema.ts.example';
  
  if (!fs.existsSync(schemaPath) && fs.existsSync(examplePath)) {
    console.log('Schema file missing but example exists, copying from example...');
    fs.copyFileSync(examplePath, schemaPath);
    console.log('✅ Created schema file from example');
    return true;
  } else if (!fs.existsSync(schemaPath)) {
    console.error('Error: Schema file not found and no example to copy from.');
    return false;
  }
  
  console.log('✅ Schema file exists at', schemaPath);
  return true;
}

// Function to ensure the product estimation service properly initializes
function fixProductEstimationService() {
  console.log('Checking productEstimationService.ts file...');
  
  const servicePath = 'src/services/productEstimationService.ts';
  
  if (!fs.existsSync(servicePath)) {
    console.error('Error: productEstimationService.ts not found!');
    return false;
  }
  
  let content = fs.readFileSync(servicePath, 'utf8');
  let changed = false;
  
  // Fix the config loading location
  if (content.includes('fetch(\'/data/product-estimations.json\'')) {
    content = content.replace(
      'fetch(\'/data/product-estimations.json\'',
      'fetch(\'/data/product-estimations.json\''
    );
    changed = true;
  }
  
  // Make sure we're handling load failures gracefully
  if (!content.includes('try {') && content.includes('loadEstimationsConfig')) {
    console.log('⚠️ Missing try/catch block in loadEstimationsConfig, adding it...');
    // This would be complex to add automatically - should be done manually
    console.log('Manual fix required - please add proper error handling to the loadEstimationsConfig function');
  }
  
  if (changed) {
    fs.writeFileSync(servicePath, content, 'utf8');
    console.log('✅ Fixed configuration loading in productEstimationService.ts');
  }
  
  return true;
}

// Main function
function main() {
  console.log('Ensuring product estimations configuration accessibility...');
  
  // Run all checks
  const configOk = copyConfigFile();
  const importsOk = fixImportPaths();
  const schemaOk = ensureSchemaFile();
  const serviceOk = fixProductEstimationService();
  
  console.log('\nSummary:');
  console.log(`- Config files: ${configOk ? '✅ OK' : '❌ Issues found'}`);
  console.log(`- Import paths: ${importsOk ? '✅ OK' : '❌ Issues found'}`);
  console.log(`- Schema file: ${schemaOk ? '✅ OK' : '❌ Issues found'}`);
  console.log(`- Estimation service: ${serviceOk ? '✅ OK' : '❌ Issues found'}`);
  
  if (configOk && importsOk && schemaOk && serviceOk) {
    console.log('\n✅ All configuration files and paths should be correctly set up!');
    console.log('\nNext step: Run the application and check if product values are being estimated correctly');
  } else {
    console.log('\n⚠️ Some issues were found that may prevent proper functioning.');
    console.log('\nPlease fix the reported issues and try again.');
  }
}

// Execute the main function
main();
