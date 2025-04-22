/**
 * Script to deploy the ProductDetailModal fetchProductDetailsRef fix to Heroku
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Update the build trigger to force a Heroku rebuild
function updateBuildTrigger() {
  const buildTriggerPath = path.join(__dirname, '../.build-trigger');
  const timestamp = new Date().toISOString();
  
  try {
    fs.writeFileSync(buildTriggerPath, timestamp);
    console.log(`✅ Updated build trigger with timestamp: ${timestamp}`);
    return true;
  } catch (err) {
    console.error('❌ Error updating build trigger:', err);
    return false;
  }
}

// Push the changes to Heroku
function deployToHeroku() {
  try {
    console.log('\n🚀 Initiating Heroku deployment...');
    
    // Add the files to git
    console.log('\n📦 Adding files to git...');
    execSync('git add src/components/products/ProductDetailModal.tsx src/utils/requestCache.ts .build-trigger', {
      stdio: 'inherit'
    });
    
    // Commit the changes
    console.log('\n✍️ Committing changes...');
    execSync('git commit -m "Fix: Add missing fetchProductDetailsRef to ProductDetailModal"', {
      stdio: 'inherit'
    });
    
    // Push to Heroku
    console.log('\n🚀 Pushing to Heroku...');
    execSync('git push heroku HEAD:main', {
      stdio: 'inherit'
    });
    
    console.log('\n✅ Successfully deployed to Heroku!');
    return true;
  } catch (err) {
    console.error('\n❌ Deployment failed:', err);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Deploying ProductDetailModal Fix to Heroku ===\n');
  
  // Update build trigger
  if (!updateBuildTrigger()) {
    console.error('❌ Failed to update build trigger. Deployment aborted.');
    process.exit(1);
  }
  
  // Deploy to Heroku
  if (!deployToHeroku()) {
    console.error('❌ Deployment to Heroku failed.');
    process.exit(1);
  }
  
  console.log(`
✨ Product detail modal fix deployed successfully! ✨

This fix addresses the 'fetchProductDetailsRef is not defined' error by:

1. Adding the missing useRef for fetchProductDetailsRef
2. Creating a requestCache utility
3. Fixing the method signature for getCategoryImage

The fix should enable the product detail modal to work correctly when viewing product details.
`);
}

// Run the script
main();
