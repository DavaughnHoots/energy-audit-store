/**
 * Test script for product recommendations backend deployment
 * This can be used to test the product recommendations API locally before deploying to Heroku
 */

const fs = require('fs');
const path = require('path');

// Create build directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Ensure build directories exist
createDirIfNotExists('backend/build');
createDirIfNotExists('backend/build/services');
createDirIfNotExists('backend/build/routes');
createDirIfNotExists('backend/build/types');

// Check if compiled JS files exist in the build directory
const productRecommendationFiles = [
  'backend/build/services/productRecommendationService.js',
  'backend/build/routes/productRecommendations.js',
  'backend/build/types/product.js'
];

let allFilesExist = true;
productRecommendationFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${filePath}`);
    allFilesExist = false;
  } else {
    console.log(`Found file: ${filePath}`);
  }
});

// Check server.js
const serverJsPath = 'backend/build/server.js';
if (!fs.existsSync(serverJsPath)) {
  console.error(`Missing main server file: ${serverJsPath}`);
  allFilesExist = false;
} else {
  console.log(`Found main server file: ${serverJsPath}`);
}

// Print result
if (allFilesExist) {
  console.log('\n✅ All required files exist. You can proceed with deployment.');
  console.log('To deploy, run: .\\deploy-product-recommendations-js-only.bat');
} else {
  console.error('\n❌ Some required files are missing.');
  console.log('Please compile the TypeScript files first, or run:');
  console.log('npm run build');
  console.log('\nAlternatively, you may need to checkout these files from the feature branch:');
  console.log('git checkout feature/product-recommendations -- backend/build');
}

// If all files exist, verify package.json configuration
if (allFilesExist) {
  console.log('\nVerifying package.json compatibility...');
  const packageJson = require('../package.json');
  const requiredDependencies = [
    'express', 'cors', 'pg', 'dotenv', 'jsonwebtoken'
  ];
  
  const missingDeps = requiredDependencies.filter(dep => !packageJson.dependencies[dep]);
  if (missingDeps.length > 0) {
    console.warn(`Warning: Missing dependencies in package.json: ${missingDeps.join(', ')}`);
    console.log('The deployment script will include these dependencies.');
  } else {
    console.log('✅ Package.json has all basic required dependencies.');
  }
}
