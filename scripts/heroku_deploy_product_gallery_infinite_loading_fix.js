/**
 * Heroku Deployment Script: Product Gallery Infinite Loading Fix
 * 
 * This script deploys fixes for the infinite loading issues in ProductGallery.tsx
 * and ProductDetailModal.tsx components.
 * 
 * The script:
 * 1. Copies the fixed versions of the components to their respective locations
 * 2. Updates the build trigger file to prompt a Heroku rebuild
 * 3. Commits and pushes changes to Heroku
 * 
 * Usage: node scripts/heroku_deploy_product_gallery_infinite_loading_fix.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { promisify } = require('util');

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const copyFileAsync = promisify(fs.copyFile);

// Define paths
const PRODUCT_GALLERY_PATH = path.join(__dirname, '../src/components/products/ProductGallery.tsx');
const PRODUCT_GALLERY_FIXED_PATH = path.join(__dirname, '../src/components/products/ProductGallery.fixed.tsx');
const PRODUCT_DETAIL_MODAL_PATH = path.join(__dirname, '../src/components/products/ProductDetailModal.tsx');
const PRODUCT_DETAIL_MODAL_FIXED_PATH = path.join(__dirname, '../src/components/products/ProductDetailModal.fixed.tsx');
const BUILD_TRIGGER_PATH = path.join(__dirname, '../.build-trigger');

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Print colored message
function printColored(message, color) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// Execute shell command and return output
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Create backup of a file
async function createBackup(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  try {
    await copyFileAsync(filePath, backupPath);
    printColored(`Created backup at ${path.basename(backupPath)}`, 'green');
  } catch (error) {
    printColored(`Warning: Could not create backup for ${path.basename(filePath)}: ${error.message}`, 'yellow');
  }
}

// Update build trigger file to force Heroku rebuild
async function updateBuildTrigger() {
  try {
    const timestamp = new Date().toISOString();
    await writeFileAsync(BUILD_TRIGGER_PATH, `Build triggered at: ${timestamp}\nFix: Product Gallery infinite loading`);
    printColored('✅ Build trigger file updated', 'green');
    return true;
  } catch (error) {
    printColored(`❌ Failed to update build trigger: ${error.message}`, 'red');
    return false;
  }
}

// Copy fixed component to its target location
async function applyComponentFix(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    printColored(`❌ Source file not found: ${path.basename(sourcePath)}`, 'red');
    return false;
  }
  
  try {
    // Create backup of original file
    await createBackup(targetPath);
    
    // Copy fixed version
    await copyFileAsync(sourcePath, targetPath);
    printColored(`✅ Successfully applied fix to ${path.basename(targetPath)}`, 'green');
    return true;
  } catch (error) {
    printColored(`❌ Failed to apply fix to ${path.basename(targetPath)}: ${error.message}`, 'red');
    return false;
  }
}

// Deploy changes to Heroku
async function deployToHeroku() {
  printColored('\nInitiating Heroku deployment...', 'cyan');
  
  // Stage modified files
  execCommand('git add src/components/products/ProductGallery.tsx src/components/products/ProductDetailModal.tsx .build-trigger');
  
  // Commit changes
  execCommand('git commit -m "Fix: Product Gallery infinite loading issues"');
  
  // Push to Heroku
  printColored('\nPushing changes to Heroku...', 'cyan');
  const pushResult = execCommand('git push heroku HEAD:main');
  
  if (pushResult) {
    printColored('\n🚀 Successfully deployed to Heroku!', 'green');
    return true;
  } else {
    printColored('\n❌ Failed to push to Heroku', 'red');
    return false;
  }
}

// Main function to orchestrate the deployment
async function deploy() {
  printColored('\n=== Product Gallery Infinite Loading Fix Deployment ===', 'magenta');
  
  printColored('\nApplying component fixes...', 'cyan');
  
  // Apply fixes to both components
  const galleryFixed = await applyComponentFix(PRODUCT_GALLERY_FIXED_PATH, PRODUCT_GALLERY_PATH);
  const modalFixed = await applyComponentFix(PRODUCT_DETAIL_MODAL_FIXED_PATH, PRODUCT_DETAIL_MODAL_PATH);
  
  if (!galleryFixed || !modalFixed) {
    printColored('\n❌ Cannot proceed with deployment due to component fix failures', 'red');
    process.exit(1);
  }
  
  // Update build trigger file
  const triggerUpdated = await updateBuildTrigger();
  if (!triggerUpdated) {
    printColored('\n❌ Cannot proceed with deployment due to build trigger update failure', 'red');
    process.exit(1);
  }
  
  // Deploy to Heroku
  const deployed = await deployToHeroku();
  if (!deployed) {
    printColored('\n❌ Deployment to Heroku failed', 'red');
    process.exit(1);
  }
  
  printColored('\n✅ Deployment completed successfully!', 'green');
  printColored('\nVerification steps:', 'cyan');
  printColored('1. Open the application and navigate to the Products2Page', 'cyan');
  printColored('2. Select a category and subcategory to verify no infinite loading occurs', 'cyan');
  printColored('3. Check browser console for any API request-related errors', 'cyan');
  printColored('4. Click on a product to verify the ProductDetailModal loads correctly', 'cyan');
}

// Execute deployment process
deploy().catch(error => {
  printColored(`\n❌ Unexpected error during deployment: ${error.message}`, 'red');
  process.exit(1);
});
