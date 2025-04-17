/**
 * Deploy Enhanced Product Gallery Components
 * 
 * This script deploys the enhanced product gallery components and SVG image generator
 * to improve the product browsing experience with reliable image fallbacks.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting deployment of enhanced product gallery components...');

// Update build trigger for Heroku
const buildTriggerPath = path.join(__dirname, '../.build-trigger');
fs.writeFileSync(buildTriggerPath, new Date().toISOString(), 'utf8');
console.log('Updated build trigger for Heroku deployment');

// Get current branch name
const getCurrentBranch = () => {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    return branch;
  } catch (error) {
    console.error('Error getting current branch:', error);
    return 'main'; // Fallback to main if we can't determine the branch
  }
};

const deployChanges = () => {
  try {
    // Get current branch
    const currentBranch = getCurrentBranch();
    console.log(`Current branch: ${currentBranch}`);
    
    // Add changes to git
    console.log('Adding files to git...');
    execSync('git add src/utils/svgImageGenerator.ts', { stdio: 'inherit' });
    execSync('git add src/components/products/EnhancedProductGallery.tsx', { stdio: 'inherit' });
    execSync('git add src/pages/Products2Page.tsx', { stdio: 'inherit' });
    execSync('git add scripts/heroku_deploy_enhanced_product_gallery.js', { stdio: 'inherit' });
    execSync('git add .build-trigger', { stdio: 'inherit' });
    
    // Commit the changes
    console.log('Committing changes...');
    execSync('git commit -m "Add enhanced product gallery with SVG generator and subcategory image fallbacks"', { stdio: 'inherit' });
    
    // Push to GitHub with upstream tracking
    console.log('Pushing to GitHub...');
    try {
      // First try normal push in case upstream is already set
      execSync('git push', { stdio: 'inherit' });
    } catch (error) {
      // If that fails, try setting the upstream
      console.log('Setting upstream branch and pushing...');
      execSync(`git push --set-upstream origin ${currentBranch}`, { stdio: 'inherit' });
    }
    
    // Push to Heroku - make sure we're pushing the current branch to Heroku main
    console.log('\nDeploying to Heroku...');
    execSync(`git push heroku ${currentBranch}:main`, { stdio: 'inherit' });
    
    console.log('\n✅ Successfully deployed enhanced product gallery to Heroku!');
    return true;
  } catch (error) {
    console.error('\n❌ Error deploying changes:', error);
    console.log('\nManual deployment instructions:');
    console.log('1. To push to GitHub: git push --set-upstream origin $(git rev-parse --abbrev-ref HEAD)');
    console.log('2. To deploy to Heroku: git push heroku $(git rev-parse --abbrev-ref HEAD):main');
    return false;
  }
};

// Summary of changes
console.log('\n📋 Summary of Changes:');
console.log('1. Added SVG Image Generator utility that creates dynamic product images');
console.log('2. Created enhanced product gallery with:');
console.log('   - Subcategory information and header');
console.log('   - Advanced filtering and sorting options');
console.log('   - Improved product cards with financial information');
console.log('   - Multi-tier image fallback system');
console.log('3. Updated Products2Page to use the enhanced gallery');

// Instructions for deployment
console.log('\n🚀 Ready to Deploy:');
console.log('This script will add, commit, and push the changes to both GitHub and Heroku.');
console.log('Type "node scripts/heroku_deploy_enhanced_product_gallery.js" to deploy.');

// If this script is being executed directly (not imported), deploy changes
if (require.main === module) {
  deployChanges();
}

module.exports = { deployChanges };
