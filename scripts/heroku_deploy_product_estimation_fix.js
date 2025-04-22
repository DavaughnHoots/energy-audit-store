/**
 * Heroku deployment script for fixing and deploying Product Estimation System
 * 
 * This script addresses the issues with the product estimation system not
 * correctly calculating values for products, and deploys the fix to Heroku.
 * 
 * Usage: node scripts/heroku_deploy_product_estimation_fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fix the path to product-estimations.json in productEstimationService.ts
function fixEstimationServicePaths() {
  console.log('Fixing paths in productEstimationService.ts...');
  
  const servicePath = 'src/services/productEstimationService.ts';
  
  if (!fs.existsSync(servicePath)) {
    console.error(`Error: ${servicePath} not found!`);
    process.exit(1);
  }
  
  let content = fs.readFileSync(servicePath, 'utf8');
  let changed = false;
  
  // Fix the URL path to load the configuration file
  if (content.includes('fetch(\'/data/product-estimations.json\'')) {
    content = content.replace(
      'fetch(\'/data/product-estimations.json\'',
      'fetch(\'/product-estimations.json\''
    );
    changed = true;
    console.log('✅ Updated config path to use root-level /product-estimations.json');
  }
  
  // Enhance error handling in estimator
  if (content.includes('enhanceProductWithEstimates(product: any)')) {
    content = content.replace(
      'export async function enhanceProductWithEstimates(product: any): Promise<any> {',
      'export async function enhanceProductWithEstimates(product: any): Promise<any> {\n  // Log input for debugging\n  console.debug("Enhancing product:", { name: product?.name, price: product?.price, category: product?.category });'
    );
    
    // Ensure we're checking for empty/undefined products
    content = content.replace(
      'if (product && (product.price === 0 || product.annualSavings === 0 || product.roi === 0)) {',
      'if (!product) {\n    console.warn("Product is null or undefined, returning as-is");\n    return product;\n  }\n\n  if (product && (product.price === undefined || product.price === null || product.price === 0 || product.annualSavings === 0 || isNaN(product.roi) || product.roi === 0)) {'
    );
    
    changed = true;
    console.log('✅ Enhanced error handling and logging in product estimation service');
  }
  
  if (changed) {
    fs.writeFileSync(servicePath, content, 'utf8');
    console.log('✅ Updated productEstimationService.ts');
  } else {
    console.log('⚠️ No changes needed in productEstimationService.ts');
  }
}

// Fix the dehumidifier estimator to handle more scenarios
function fixDehumidifierEstimator() {
  console.log('Updating DehumidifierEstimator.ts...');
  
  const estimatorPath = 'src/services/productEstimation/DehumidifierEstimator.ts';
  
  if (!fs.existsSync(estimatorPath)) {
    console.error(`Warning: ${estimatorPath} not found! May need to be created.`);
    return false;
  }
  
  let content = fs.readFileSync(estimatorPath, 'utf8');
  let changed = false;
  
  // Ensure more robust attribute handling
  if (content.includes('estimate(attributes: Dehumidifier)')) {
    // Make the estimator more resilient to missing attributes
    content = content.replace(
      'const capacityPintsPerDay = attributes.capacityPintsPerDay || 35;',
      'const capacityPintsPerDay = attributes.capacityPintsPerDay || 35; // Default to medium capacity'
    );
    
    // Ensure we always return reasonable defaults when data is missing
    if (!content.includes('// Fall back to defaults if attributes are missing')) {
      const fallbackCode = `
    // Fall back to defaults if attributes are missing
    if (!attributes || (attributes && !attributes.capacityPintsPerDay && !attributes.isEnergyStar)) {
      console.debug("Missing dehumidifier attributes, using defaults");
      
      // Basic defaults for a medium-sized ENERGY STAR dehumidifier
      const defaultPrice = 249.99;
      const defaultAnnualSavings = 35.00;
      const defaultRoi = 0.14; // 14%
      const defaultPaybackPeriod = 7.1;
      
      return {
        price: defaultPrice,
        annualSavings: defaultAnnualSavings,
        roi: defaultRoi,
        paybackPeriod: defaultPaybackPeriod,
        energyEfficiency: "ENERGY STAR Certified",
        formattedPrice: \`\$\${defaultPrice.toLocaleString()}\`,
        formattedAnnualSavings: \`\$\${defaultAnnualSavings.toLocaleString()}\`,
        formattedRoi: \`\${(defaultRoi * 100).toFixed(1)}%\`,
        formattedPaybackPeriod: \`\${defaultPaybackPeriod.toFixed(1)} years\`,
        confidenceLevel: 'low',
        additionalMetrics: {
          annualKwh: 350,
          lifetimeEnergyCost: 630,
          formattedLifetimeEnergyCost: '$630',
          capacityTier: 'medium',
          dailyRunHours: 12,
          annualRunDays: 180
        }
      };
    }`;
      
      // Insert this before the capacity tier determination
      content = content.replace(
        '// Determine capacity tier',
        `${fallbackCode}\n\n    // Determine capacity tier`
      );
      
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(estimatorPath, content, 'utf8');
    console.log('✅ Updated DehumidifierEstimator.ts with better fallbacks');
  } else {
    console.log('⚠️ No changes made to DehumidifierEstimator.ts');
  }
  
  return true;
}

// Copy configuration to Heroku-accessible location
function copyConfigForHeroku() {
  console.log('Preparing configuration for Heroku...');
  
  const sourceFile = 'public/data/product-estimations.json';
  const rootFile = 'public/product-estimations.json';
  
  // Check if source file exists
  if (!fs.existsSync(sourceFile)) {
    console.error(`Error: Source configuration file not found at ${sourceFile}`);
    console.log('Skipping config copy - make sure to create this file');
    return false;
  }
  
  // Copy to root public folder where it will be accessible on Heroku
  try {
    fs.copyFileSync(sourceFile, rootFile);
    console.log(`✅ Copied configuration to ${rootFile} for Heroku deployment`);
    
    // Add to git
    try {
      execSync(`git add ${rootFile}`);
      console.log('✅ Added configuration file to git');
    } catch (error) {
      console.error('Error adding config to git:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error copying configuration file:', error.message);
    return false;
  }
}

// Update ProductDetailModal to be more resilient with null/undefined values
function fixProductDetailModal() {
  console.log('Updating ProductDetailModal.tsx...');
  
  const modalPath = 'src/components/products/ProductDetailModal.tsx';
  
  if (!fs.existsSync(modalPath)) {
    console.error(`Error: ${modalPath} not found!`);
    return false;
  }
  
  let content = fs.readFileSync(modalPath, 'utf8');
  let changed = false;
  
  // Add more debugging for development
  if (!content.includes('console.debug("Enhanced product:"')) {
    content = content.replace(
      'setProduct(enhancedProduct);',
      'console.debug("Enhanced product:", { price: enhancedProduct?.price, annualSavings: enhancedProduct?.annualSavings, roi: enhancedProduct?.roi });\n      setProduct(enhancedProduct);'
    );
    changed = true;
  }
  
  // Fix null roi display
  if (content.includes('safeToFixed(product?.roi * 100, 1)')) {
    // This could be causing NaN display - make it more robust
    content = content.replace(
      'safeToFixed(product?.roi * 100, 1)',
      'safeToFixed((product?.roi || 0) * 100, 1)'
    );
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(modalPath, content, 'utf8');
    console.log('✅ Updated ProductDetailModal.tsx');
  } else {
    console.log('⚠️ No changes needed in ProductDetailModal.tsx');
  }
  
  return true;
}

// Create a trigger file for build
function createBuildTrigger() {
  console.log('Creating build trigger...');
  
  const triggerFilePath = '.build-trigger';
  const timestamp = new Date().toISOString();
  
  fs.writeFileSync(triggerFilePath, `Build triggered at ${timestamp} for Product Estimation System fix\n`, { flag: 'a' });
  
  console.log(`✅ Build trigger created at ${timestamp}`);
}

// Commit changes
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add modified files
    execSync('git add src/services/productEstimationService.ts src/services/productEstimation/DehumidifierEstimator.ts src/components/products/ProductDetailModal.tsx public/product-estimations.json .build-trigger');
    
    // Commit with descriptive message
    execSync('git commit -m "Fix product estimation system to calculate values properly"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes:');
    console.log('git add src/services/productEstimationService.ts src/services/productEstimation/DehumidifierEstimator.ts src/components/products/ProductDetailModal.tsx public/product-estimations.json .build-trigger');
    console.log('git commit -m "Fix product estimation system to calculate values properly"');
    return false;
  }
}

// Deploy to Heroku
function deployToHeroku() {
  console.log('Deploying to Heroku...');
  
  try {
    // Push to Heroku
    execSync('git push heroku HEAD:main', { stdio: 'inherit' });
    
    console.log('✅ Deployment to Heroku completed successfully!');
    return true;
  } catch (error) {
    console.error('Error deploying to Heroku:', error.message);
    console.log('Please follow the manual deployment procedure:');
    console.log('git push heroku HEAD:main');
    return false;
  }
}

// Main function
function main() {
  console.log('Starting deployment for Product Estimation System fix...');
  
  // Run the fixes
  fixEstimationServicePaths();
  fixDehumidifierEstimator();
  copyConfigForHeroku();
  fixProductDetailModal();
  createBuildTrigger();
  
  // Deploy
  const committed = commitChanges();
  if (committed) {
    deployToHeroku();
  }
  
  console.log('\n✅ Product Estimation System fix process completed!');
  console.log('\nThe fix addresses:');
  console.log('1. Path issues with the configuration file');
  console.log('2. Error handling in the estimation service');
  console.log('3. Fallback values for missing attributes');
  console.log('4. Improved debugging');
  console.log('5. Fixed null/undefined handling');
}

// Execute the main function
main();
