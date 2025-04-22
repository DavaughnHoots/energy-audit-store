/**
 * Fix Product Gallery Null Checks
 * 
 * This script adds proper null/undefined checks to the EnhancedProductGallery component
 * to prevent errors when displaying products with missing financial data.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting EnhancedProductGallery null checks fix...');

// Update build trigger for Heroku
const buildTriggerPath = path.join(__dirname, '../.build-trigger');
fs.writeFileSync(buildTriggerPath, new Date().toISOString(), 'utf8');
console.log('Updated build trigger for Heroku deployment');

// Get the file path
const filePath = path.join(__dirname, '../src/components/products/EnhancedProductGallery.tsx');

// Read the file content
let content = fs.readFileSync(filePath, 'utf8');

// Apply fixes for potential null/undefined values

// 1. Fix price formatting
content = content.replace(
  /\$\{product\.price\.toLocaleString\(\)\}/g,
  '${(product.price || 0).toLocaleString()}'
);

// 2. Fix annual savings formatting
content = content.replace(
  /\$\{product\.annualSavings\.toLocaleString\(\)\}\/yr/g,
  '${(product.annualSavings || 0).toLocaleString()}/yr'
);

// 3. Fix ROI formatting
content = content.replace(
  /\{\(product\.roi \* 100\)\.toFixed\(1\)\}%/g,
  '{((product.roi || 0) * 100).toFixed(1)}%'
);

// 4. Fix payback period formatting
content = content.replace(
  /\{product\.paybackPeriod\.toFixed\(1\)\} years/g,
  '{(product.paybackPeriod || 0).toFixed(1)} years'
);

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully added null checks to EnhancedProductGallery.tsx');

// Commit changes
const commitChanges = () => {
  try {
    console.log('Adding files to git...');
    execSync('git add src/components/products/EnhancedProductGallery.tsx .build-trigger', { stdio: 'inherit' });
    
    console.log('Committing changes...');
    execSync('git commit -m "Fix: Add null checks to EnhancedProductGallery to prevent errors with incomplete product data"', { stdio: 'inherit' });
    
    // Push to GitHub
    console.log('Pushing to GitHub...');
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    try {
      // First try normal push in case upstream is already set
      execSync('git push', { stdio: 'inherit' });
    } catch (error) {
      // If that fails, try setting the upstream
      console.log('Setting upstream branch and pushing...');
      execSync(`git push --set-upstream origin ${currentBranch}`, { stdio: 'inherit' });
    }
    
    // Push to Heroku
    console.log('\nDeploying to Heroku...');
    execSync(`git push heroku ${currentBranch}:main`, { stdio: 'inherit' });
    
    console.log('\n✅ Successfully deployed EnhancedProductGallery fixes to Heroku!');
    return true;
  } catch (error) {
    console.error('\n❌ Error deploying changes:', error);
    console.log('\nManual deployment instructions:');
    console.log('1. To push to GitHub: git push --set-upstream origin $(git rev-parse --abbrev-ref HEAD)');
    console.log('2. To deploy to Heroku: git push heroku $(git rev-parse --abbrev-ref HEAD):main');
    return false;
  }
};

// If this script is being executed directly (not imported), deploy changes
if (require.main === module) {
  commitChanges();
}

module.exports = { commitChanges };
