/**
 * Fix for product gallery infinite loading issues - ProductGallery only version
 * 
 * This script addresses the critical issue in ProductGallery.tsx causing infinite API calls
 * 
 * Changes:
 * - Added request fingerprinting to prevent duplicate API calls
 * - Implemented proper request abortion for cleanup
 * - Added detailed debug logging for easier troubleshooting
 * 
 * Usage: node scripts/fix_product_gallery_only.js
 */

const fs = require('fs');
const path = require('path');

// Define paths
const PRODUCT_GALLERY_PATH = path.join(__dirname, '../src/components/products/ProductGallery.tsx');
const PRODUCT_GALLERY_FIXED_PATH = path.join(__dirname, '../src/components/products/ProductGallery.fixed.tsx');

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

// Create backup of original file before modification
function createBackup(filePath) {
  const backupPath = `${filePath}.backup-${Date.now()}`;
  try {
    fs.copyFileSync(filePath, backupPath);
    printColored(`Created backup at ${path.basename(backupPath)}`, 'green');
    return true;
  } catch (error) {
    printColored(`Warning: Could not create backup for ${path.basename(filePath)}: ${error.message}`, 'yellow');
    return false;
  }
}

// Apply the fix for ProductGallery.tsx
function fixProductGallery() {
  try {
    // Check if fixed file exists
    if (!fs.existsSync(PRODUCT_GALLERY_FIXED_PATH)) {
      printColored('Error: ProductGallery.fixed.tsx not found. Please create the fixed file first.', 'red');
      return false;
    }
    
    // Create backup of original file
    const backupCreated = createBackup(PRODUCT_GALLERY_PATH);
    if (!backupCreated) {
      printColored('Proceeding without backup...', 'yellow');
    }
    
    // Replace original file with fixed version
    fs.copyFileSync(PRODUCT_GALLERY_FIXED_PATH, PRODUCT_GALLERY_PATH);
    printColored('✅ Successfully applied fix to ProductGallery.tsx', 'green');
    
    return true;
  } catch (error) {
    printColored(`❌ Error fixing ProductGallery.tsx: ${error.message}`, 'red');
    return false;
  }
}

// Main function 
function main() {
  printColored('\n=== Product Gallery Infinite Loading Fix - Gallery Component Only ===', 'magenta');
  
  const success = fixProductGallery();
  
  if (success) {
    printColored('\n✅ Product Gallery component fixed successfully!', 'green');
    printColored('\nNext steps:', 'cyan');
    printColored('1. Test the fix locally to ensure the infinite loading is resolved', 'cyan');
    printColored('2. Deploy to Heroku using the deployment script (after completing ProductDetailModal fix)', 'cyan');
    printColored('   OR proceed with Heroku deployment of just this component if urgent', 'cyan');
  } else {
    printColored('\n❌ Failed to apply fixes to ProductGallery component', 'red');
    process.exit(1);
  }
}

// Execute the script
main();
