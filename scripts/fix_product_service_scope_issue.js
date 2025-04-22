/**
 * Fix script for product service scope issue
 * 
 * This script fixes the JavaScript scope issue in productService.ts where the
 * ensureFinancialMetrics function was defined inside one method but needed in others
 * 
 * Usage: node scripts/fix_product_service_scope_issue.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a build trigger to force a deployment
function createBuildTrigger() {
  console.log('Creating build trigger...');
  
  const triggerFilePath = '.build-trigger';
  const timestamp = new Date().toISOString();
  
  fs.writeFileSync(triggerFilePath, `Build triggered at ${timestamp} for Product Service Scope Fix\n`, { flag: 'a' });
  
  console.log(`✅ Build trigger created at ${timestamp}`);
}

// Fix the product service scope issue
function fixProductServiceScopeIssue() {
  console.log('Fixing product service scope issue...');
  
  const servicePath = 'src/services/productService.ts';
  
  if (!fs.existsSync(servicePath)) {
    console.error(`❌ File not found: ${servicePath}`);
    return false;
  }
  
  try {
    // Read the existing file
    let serviceContent = fs.readFileSync(servicePath, 'utf8');
    
    // Check if this function is already defined at class level
    if (serviceContent.includes('private ensureFinancialMetrics')) {
      console.log('Product service already has the function at class level, skipping.');
      return true;
    }
    
    // First, find and extract the ensureFinancialMetrics function if it exists inside a method
    const functionMatch = serviceContent.match(/const ensureFinancialMetrics\s*=\s*\(products:\s*Product\[\]\):\s*Product\[\]\s*=>\s*{[\s\S]*?return products[\s\S]*?};/);
    
    if (!functionMatch) {
      console.error('❌ Could not find ensureFinancialMetrics function in productService.ts');
      return false;
    }
    
    // Get the function code
    const functionCode = functionMatch[0];
    
    // Remove the function from inside the getProducts method
    serviceContent = serviceContent.replace(functionCode, '');
    
    // Add the function as a private class method
    const privateMethodCode = `
  // Ensure products have financial metrics
  private ensureFinancialMetrics(products: Product[]): Product[] {
    return products.map(product => {
      // Only set defaults if these fields are missing or zero
      if (!product.price || product.price === 0) {
        const baseDefaults = {
          price: 199.99,
          annualSavings: 25.00,
          roi: 0.125,
          paybackPeriod: 8.0
        };
        
        // Product-specific defaults based on type
        if (product.subCategory === 'Dehumidifiers') {
          return {
            ...product,
            price: 249.99,
            annualSavings: 35.00,
            roi: 0.14,
            paybackPeriod: 7.14
          };
        }
        
        return { ...product, ...baseDefaults };
      }
      return product;
    });
  }`;
    
    // Add the private method right after the class opening
    serviceContent = serviceContent.replace(
      /class ProductService {[\s\S]*?private initialized = false;/, 
      match => match + privateMethodCode
    );
    
    // Now fix any references to ensureFinancialMetrics in the getProducts method
    serviceContent = serviceContent.replace(
      /async getProducts\(filters\?: ProductFilter\): Promise<Product\[\]> {[\s\S]*?}/,
      match => {
        return match.replace(/ensureFinancialMetrics\(/g, 'this.ensureFinancialMetrics(');
      }
    );
    
    // Fix the implementation of getProductsPaginated to use the private method
    serviceContent = serviceContent.replace(
      /const data = await response\.json\(\); return (ensureFinancialMetrics|data)/g,
      'const data = await response.json(); return this.ensureFinancialMetrics(Array.isArray(data) ? data : (data.items || [data]))'
    );
    
    // Fix the paginated response handler
    serviceContent = serviceContent.replace(
      /const data = await response\.json\(\); data\.items = (ensureFinancialMetrics\()?data\.items(\) )?;/g,
      'const data = await response.json(); data.items = this.ensureFinancialMetrics(data.items);'
    );
    
    // Write the updated file
    fs.writeFileSync(servicePath, serviceContent);
    
    console.log(`✅ Successfully updated ${servicePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${servicePath}:`, error.message);
    return false;
  }
}

// Commit changes
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add modified files
    execSync('git add .build-trigger src/services/productService.ts');
    
    // Commit with descriptive message
    execSync('git commit -m "Fix product service scope issue for financial metrics"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes:');
    console.log('git add .build-trigger src/services/productService.ts');
    console.log('git commit -m "Fix product service scope issue for financial metrics"');
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
  console.log('Starting fix for product service scope issue...');
  
  // Fix the product service scope issue
  const serviceFixed = fixProductServiceScopeIssue();
  
  if (!serviceFixed) {
    console.error('Failed to fix product service scope issue. Fix aborted.');
    process.exit(1);
  }
  
  // Create build trigger
  createBuildTrigger();
  
  // Commit and deploy changes
  const committed = commitChanges();
  if (committed) {
    deployToHeroku();
  }
  
  console.log('\n✅ Product service scope issue fix process completed!');
}

// Execute the main function
main();
