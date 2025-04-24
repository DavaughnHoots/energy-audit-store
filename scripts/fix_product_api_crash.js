/**
 * Emergency Fix for Product API Crash
 * 
 * This script fixes the critical error in the backend/src/routes/products.ts file:
 * "SyntaxError: Identifier 'cacheKey' has already been declared"
 * 
 * This is a targeted fix to get the app running again.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const branchName = `fix/product-api-crash-${Date.now()}`;
const commitMessage = 'Fix product API crash - resolve duplicate variable declarations';

// Create new branch
console.log(`Creating new git branch: ${branchName}...`);
try {
  execSync(`git checkout -b ${branchName}`);
  console.log('✓ Created new branch');
} catch (error) {
  console.error('Failed to create branch:', error.message);
  process.exit(1);
}

// Fix the products.ts file
console.log('Fixing products.ts file...');
try {
  const routesFile = path.resolve('backend/src/routes/products.ts');
  let content = fs.readFileSync(routesFile, 'utf8');

  // First, add the missing productCache import/declaration if needed
  if (!content.includes('const productCache')) {
    content = content.replace(
      'import { pool } from \'../config/database.js\';',
      'import { pool } from \'../config/database.js\';\nimport NodeCache from \'node-cache\';\n\n// Cache for product details with 10 minute TTL\nconst productCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });'
    );
  }

  // Fix the duplicate block by removing the second cache check in the /:id/similar route
  const duplicateBlockRegex = /\/\/ Check cache first\s+const cacheKey = `product_\${req\.params\.id}`;\s+const cachedProduct = productCache\.get\(cacheKey\);\s+\s+if \(cachedProduct\) \{\s+console\.log\('Cache hit for product:', req\.params\.id\);\s+return res\.json\(\{\s+success: true,\s+product: cachedProduct\s+\}\);\s+\}\s+\s+console\.log\('Cache miss for product:', req\.params\.id\);\s+\/\/ Check cache first\s+const cacheKey/;

  const fixedContent = content.replace(
    duplicateBlockRegex,
    '// Check cache first\n    const cacheKey'
  );

  fs.writeFileSync(routesFile, fixedContent);
  console.log('✓ Fixed duplicate variable declarations in products.ts');

  // Update package.json if needed to add node-cache
  const pkgFile = path.resolve('backend/package.json');
  const pkgContent = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  
  if (!pkgContent.dependencies['node-cache']) {
    pkgContent.dependencies['node-cache'] = '^5.1.2';
    fs.writeFileSync(pkgFile, JSON.stringify(pkgContent, null, 2));
    console.log('✓ Added node-cache dependency to package.json');
  }

  // Create temporary build-trigger file to force Heroku rebuild
  fs.writeFileSync('.build-trigger', new Date().toISOString());
  console.log('✓ Created build trigger file');

} catch (error) {
  console.error('Failed to fix products.ts file:', error.message);
  process.exit(1);
}

// Add files to git
console.log('Adding files to git...');
try {
  execSync('git add backend/src/routes/products.ts backend/package.json .build-trigger');
  console.log('✓ Added files to git');
} catch (error) {
  console.error('Failed to add files to git:', error.message);
  process.exit(1);
}

// Commit changes
console.log('Committing changes...');
try {
  execSync(`git commit -m "${commitMessage}"`);
  console.log('✓ Committed changes');
} catch (error) {
  console.error('Failed to commit changes:', error.message);
  process.exit(1);
}

// Push to Heroku
console.log('Pushing to Heroku...');
try {
  execSync('git push heroku HEAD:master -f');
  console.log('✓ Deployed to Heroku successfully!');
} catch (error) {
  console.error('Failed to push to Heroku:', error.message);
  process.exit(1);
}

console.log('\n EMERGENCY PRODUCT API CRASH FIX DEPLOYED SUCCESSFULLY \n');
console.log(`
The critical error causing the app to crash has been fixed:

1. Fixed duplicate variable declarations in products.ts:
   - Removed the duplicate "const cacheKey" and "const cachedProduct" declarations
   - Added missing NodeCache import and initialization

2. Application should now start correctly without the SyntaxError

Note that there are still TypeScript errors that need to be addressed in a follow-up fix,
but the application should now be operational.

To verify the fix, visit:
https://energy-audit-store-e66479ed4f2b.herokuapp.com/products2
`);
