/**
 * Debugging script for Product Estimation System
 * 
 * This script adds debugging to help diagnose issues with the product estimation system
 * that's not generating values for dehumidifiers.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Add debugging to the productEstimationService.ts file
function addDebuggingToEstimationService() {
  console.log('Adding debugging to productEstimationService.ts...');
  
  const servicePath = 'src/services/productEstimationService.ts';
  
  if (!fs.existsSync(servicePath)) {
    console.error(`Error: ${servicePath} not found!`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(servicePath, 'utf8');
  
  // Add debugging to loadEstimationsConfig
  content = content.replace(
    'export async function loadEstimationsConfig(): Promise<ProductEstimationsConfig> {',
    'export async function loadEstimationsConfig(): Promise<ProductEstimationsConfig> {\n  console.log("[DEBUG] Starting to load estimations config");'
  );
  
  content = content.replace(
    'const response = await fetch(\'/data/product-estimations.json\',',
    'console.log("[DEBUG] Fetching estimations config from /data/product-estimations.json");\n    const response = await fetch(\'/data/product-estimations.json\','
  );
  
  content = content.replace(
    'if (!response.ok) {',
    'console.log("[DEBUG] Estimations config fetch response:", response.status, response.statusText);\n    if (!response.ok) {'
  );
  
  content = content.replace(
    'const configData = await response.json();',
    'const configData = await response.json();\n    console.log("[DEBUG] Loaded estimations config data:", configData.schemaVersion);'
  );
  
  // Add debugging to enhanceProductWithEstimates
  content = content.replace(
    'export async function enhanceProductWithEstimates(product: any): Promise<any> {',
    'export async function enhanceProductWithEstimates(product: any): Promise<any> {\n  console.log("[DEBUG] enhanceProductWithEstimates called with:", {\n    name: product?.name,\n    price: product?.price,\n    annualSavings: product?.annualSavings,\n    roi: product?.roi,\n    category: product?.category\n  });'
  );
  
  content = content.replace(
    'if (product && (product.price === 0 || product.annualSavings === 0 || product.roi === 0)) {',
    'if (product && (product.price === 0 || product.annualSavings === 0 || product.roi === 0)) {\n    console.log("[DEBUG] Values missing, generating estimates");'
  );
  
  content = content.replace(
    'const estimates = await generateProductEstimates(product);',
    'console.log("[DEBUG] Calling generateProductEstimates");\n      const estimates = await generateProductEstimates(product);'
  );
  
  content = content.replace(
    'return {',
    'console.log("[DEBUG] Generated estimates:", estimates);\n      return {'
  );
  
  // Add debugging to generateProductEstimates
  content = content.replace(
    'export async function generateProductEstimates(product: any): Promise<EstimateResult> {',
    'export async function generateProductEstimates(product: any): Promise<EstimateResult> {\n  console.log("[DEBUG] generateProductEstimates starting");'
  );
  
  content = content.replace(
    'const config = await loadEstimationsConfig();',
    'console.log("[DEBUG] Loading configuration");\n    const config = await loadEstimationsConfig();'
  );
  
  content = content.replace(
    'const category = determineProductCategory(product);',
    'const category = determineProductCategory(product);\n    console.log("[DEBUG] Determined product category:", category);'
  );
  
  content = content.replace(
    'const region = getUserRegion();',
    'const region = getUserRegion();\n    console.log("[DEBUG] User region:", region);'
  );
  
  // Add more verbose error reporting in the catch block
  content = content.replace(
    'console.error(\'Error generating product estimates:\', error);',
    'console.error(\'Error generating product estimates:\', error);\n    console.error(\'Error details:\', error instanceof Error ? error.stack : String(error));'
  );
  
  // Write the changes back to the file
  fs.writeFileSync(servicePath, content, 'utf8');
  console.log('✅ Added debugging to productEstimationService.ts');
}

// Fix the path to the estimations config file
function fixConfigPath() {
  console.log('Checking config path in productEstimationService.ts...');
  
  const servicePath = 'src/services/productEstimationService.ts';
  
  if (!fs.existsSync(servicePath)) {
    console.error(`Error: ${servicePath} not found!`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(servicePath, 'utf8');
  
  // Fix the path to use the right location
  if (content.includes('fetch(\'/data/product-estimations.json\'')) {
    content = content.replace(
      'fetch(\'/data/product-estimations.json\'',
      'fetch(\'/public/data/product-estimations.json\''
    );
    
    // Write the changes back to the file
    fs.writeFileSync(servicePath, content, 'utf8');
    console.log('✅ Updated config path to /public/data/product-estimations.json');
  } else {
    console.log('⚠️ Could not find config path to update');
  }
}

// Add additional debug flags to ProductDetailModal
function debugProductDetailModal() {
  console.log('Adding debugging to ProductDetailModal.tsx...');
  
  const modalPath = 'src/components/products/ProductDetailModal.tsx';
  
  if (!fs.existsSync(modalPath)) {
    console.error(`Error: ${modalPath} not found!`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(modalPath, 'utf8');
  
  // Add debugging to the fetch operation
  content = content.replace(
    'const productData = await response.json();',
    'const productData = await response.json();\n      console.log("[DEBUG] Fetched product data:", {\n        name: productData?.name,\n        price: productData?.price,\n        annualSavings: productData?.annualSavings,\n        roi: productData?.roi,\n        category: productData?.category\n      });'
  );
  
  content = content.replace(
    'const enhancedProduct = await enhanceProductWithEstimates(productData);',
    'console.log("[DEBUG] Calling enhanceProductWithEstimates");\n      const enhancedProduct = await enhanceProductWithEstimates(productData);\n      console.log("[DEBUG] Received enhanced product:", {\n        name: enhancedProduct?.name,\n        price: enhancedProduct?.price,\n        annualSavings: enhancedProduct?.annualSavings,\n        roi: enhancedProduct?.roi,\n        category: enhancedProduct?.category,\n        confidenceLevel: enhancedProduct?.confidenceLevel\n      });'
  );
  
  // Write the changes back to the file
  fs.writeFileSync(modalPath, content, 'utf8');
  console.log('✅ Added debugging to ProductDetailModal.tsx');
}

// Ensure that mock API endpoint is defined correctly
function checkApiEndpoints() {
  console.log('Checking API endpoints configuration...');
  
  const apiConfigPath = 'src/config/api.ts';
  
  if (fs.existsSync(apiConfigPath)) {
    const content = fs.readFileSync(apiConfigPath, 'utf8');
    console.log('API endpoints configuration exists. Here are some key paths:');
    
    // Check for product-related endpoints
    if (content.includes('GET_PRODUCT_DETAIL')) {
      console.log('✅ GET_PRODUCT_DETAIL endpoint is defined');
    } else {
      console.log('⚠️ GET_PRODUCT_DETAIL endpoint not found');
    }
    
    // Additional info for debugging
    console.log('You may need to check that the endpoint returns properly structured data');
  } else {
    console.log('⚠️ API config file not found at:', apiConfigPath);
  }
}

// Main function
function main() {
  console.log('Starting product estimation debugging...');
  
  // Check if we have the required files
  if (!fs.existsSync('public/data/product-estimations.json')) {
    console.error('Error: public/data/product-estimations.json not found!');
    console.log('⚠️ This could be the issue - the configuration file is missing.');
    console.log('Make sure the product-estimations.json file is in the public/data/ directory.');
  } else {
    console.log('✅ Product estimations config file exists');
  }
  
  // Run the fixes
  addDebuggingToEstimationService();
  fixConfigPath();
  debugProductDetailModal();
  checkApiEndpoints();
  
  console.log('\n✅ Debug additions complete!');
  console.log('\nNext steps:');
  console.log('1. Check your browser console for [DEBUG] logs when viewing product details');
  console.log('2. Make sure the product-estimations.json file is being properly loaded');
  console.log('3. Verify that the product data structure matches what the estimation service expects');
}

// Execute the main function
main();
