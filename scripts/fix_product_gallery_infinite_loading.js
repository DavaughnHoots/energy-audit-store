/**
 * Fix for product gallery infinite loading issues
 * 
 * This script addresses two critical issues:
 * 1. ProductGallery.tsx - Infinite loading loop due to improper dependency management
 * 2. ProductDetailModal.tsx - Missing function references causing API request issues
 * 
 * Changes:
 * - Added request fingerprinting to prevent duplicate API calls
 * - Implemented proper request abortion for cleanup
 * - Added detailed debug logging for easier troubleshooting
 * - Fixed missing function references in ProductDetailModal
 * 
 * Usage: node scripts/fix_product_gallery_infinite_loading.js
 */

const fs = require('fs');
const path = require('path');

// Define paths for files to modify and their fixed versions
const PRODUCT_GALLERY_PATH = path.join(__dirname, '../src/components/products/ProductGallery.tsx');
const PRODUCT_GALLERY_FIXED_PATH = path.join(__dirname, '../src/components/products/ProductGallery.fixed.tsx');
const PRODUCT_DETAIL_MODAL_PATH = path.join(__dirname, '../src/components/products/ProductDetailModal.tsx');
const PRODUCT_DETAIL_MODAL_FIXED_PATH = path.join(__dirname, '../src/components/products/ProductDetailModal.fixed.tsx');

// Create backup of original files before modification
function createBackup(filePath) {
  const backupPath = `${filePath}.backup`;
  if (!fs.existsSync(backupPath)) {
    console.log(`Creating backup of ${path.basename(filePath)} at ${backupPath}`);
    fs.copyFileSync(filePath, backupPath);
  } else {
    console.log(`Backup already exists for ${path.basename(filePath)}`);
  }
}

// Apply the fix for ProductGallery.tsx
function fixProductGallery() {
  try {
    // Check if fixed file exists
    if (!fs.existsSync(PRODUCT_GALLERY_FIXED_PATH)) {
      console.error('Error: ProductGallery.fixed.tsx not found. Please create the fixed file first.');
      process.exit(1);
    }
    
    // Create backup of original file
    createBackup(PRODUCT_GALLERY_PATH);
    
    // Replace original file with fixed version
    fs.copyFileSync(PRODUCT_GALLERY_FIXED_PATH, PRODUCT_GALLERY_PATH);
    console.log('✓ Successfully applied fix to ProductGallery.tsx');
    
    return true;
  } catch (error) {
    console.error('Error fixing ProductGallery.tsx:', error.message);
    return false;
  }
}

// Apply the fix for ProductDetailModal.tsx
function fixProductDetailModal() {
  try {
    // Check if fixed file exists
    if (!fs.existsSync(PRODUCT_DETAIL_MODAL_FIXED_PATH)) {
      console.error('Error: ProductDetailModal.fixed.tsx not found. Please create the fixed file first.');
      process.exit(1);
    }
    
    // Create backup of original file
    createBackup(PRODUCT_DETAIL_MODAL_PATH);
    
    // Replace original file with fixed version
    fs.copyFileSync(PRODUCT_DETAIL_MODAL_FIXED_PATH, PRODUCT_DETAIL_MODAL_PATH);
    console.log('✓ Successfully applied fix to ProductDetailModal.tsx');
    
    return true;
  } catch (error) {
    console.error('Error fixing ProductDetailModal.tsx:', error.message);
    return false;
  }
}

// Main function to apply all fixes
function applyFixes() {
  console.log('Starting application of infinite loading fixes...');
  
  const galleryFixed = fixProductGallery();
  const modalFixed = fixProductDetailModal();
  
  if (galleryFixed && modalFixed) {
    console.log('\n✅ All fixes successfully applied!');
    console.log('\nNext steps:');
    console.log('1. Build the application with: npm run build');
    console.log('2. Deploy to Heroku with: git push heroku HEAD:main');
    console.log('3. Verify the fix by navigating to subcategories and products');
  } else {
    console.log('\n⚠️ Some fixes could not be applied. Please check the errors above.');
    process.exit(1);
  }
}

// Execute the fixes
applyFixes();
