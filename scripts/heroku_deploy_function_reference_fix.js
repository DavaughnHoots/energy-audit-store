/**
 * Script to deploy the function reference fix to Heroku
 * This addresses the infinite loading issue in the Products2Page
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File paths
const useProductsPath = path.join(__dirname, '../src/hooks/useProducts.ts');
const backupPath = `${useProductsPath}.backup-${Date.now()}`;
const buildTriggerPath = path.join(__dirname, '../.build-trigger');

// Create backup of original file
function createBackup() {
  try {
    fs.copyFileSync(useProductsPath, backupPath);
    console.log(`Created backup at ${path.basename(backupPath)}`);
    return true;
  } catch (err) {
    console.error('Error creating backup:', err);
    return false;
  }
}

// Fix the useProducts.ts file by adding useCallback
function fixUseProductsFile() {
  try {
    // Read the original file
    let content = fs.readFileSync(useProductsPath, 'utf8');
    
    // Update imports to include useCallback
    content = content.replace(
      "import { useState, useEffect } from 'react';",
      "import { useState, useEffect, useCallback } from 'react';"
    );
    
    // Find the getFilteredProducts function
    const getFilteredProductsRegex = /(\s+const getFilteredProducts = async[\s\S]+?\);)/;
    const getProductRegex = /(\s+const getProduct = async[\s\S]+?\);)/;
    
    // Extract the function bodies
    const getFilteredProductsMatch = content.match(getFilteredProductsRegex);
    const getProductMatch = content.match(getProductRegex);
    
    if (!getFilteredProductsMatch || !getProductMatch) {
      console.error('Could not find functions to wrap with useCallback');
      return false;
    }
    
    // Wrap functions with useCallback
    const getFilteredProductsReplacement = `
  // Memoize function to keep one instance only
  const getFilteredProducts = useCallback(
    async (
      filters?: ProductFilters,
      page: number = 1,
      limit: number = 20,
      sortBy: string = 'relevance',
      sortOrder: 'asc' | 'desc' = 'desc'
    ): Promise<PaginatedProducts> => {
      try {
        console.log('Requesting filtered products with:', { filters, page, limit, sortBy, sortOrder });
        
        // Use the paginated API endpoint
        const result = await productService.getProductsPaginated(
          filters,
          page,
          limit,
          sortBy,
          sortOrder
        );
        
        // Deep validation of the result
        if (!result) {
          throw new Error('API returned empty response');
        }
        
        // Ensure all required fields are present with defaults if not
        const validatedResult: PaginatedProducts = {
          items: Array.isArray(result.items) ? result.items : [],
          total: typeof result.total === 'number' ? result.total : 0,
          page: typeof result.page === 'number' ? result.page : page,
          totalPages: typeof result.totalPages === 'number' ? result.totalPages : 0
        };

        console.log(\`Successfully retrieved filtered products:\`, {
          count: validatedResult.items.length,
          total: validatedResult.total,
          totalPages: validatedResult.totalPages
        });
        
        return validatedResult;
      } catch (err) {
        console.error('Error getting filtered products:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        
        // Return empty result with pagination info
        const emptyResult = {
          items: [],
          total: 0,
          page,
          totalPages: 0
        };
        
        console.log('Returning empty result due to error');
        return emptyResult;
      }
    },
    [] // Empty dependency array for stable reference
  );`;
    
    const getProductReplacement = `
  // Memoize function to keep one instance only
  const getProduct = useCallback(
    async (id: string) => {
      try {
        return await productService.getProduct(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        return null;
      }
    },
    [] // Empty dependency array for stable reference
  );`;
    
    // Replace the functions with memoized versions
    content = content.replace(getFilteredProductsRegex, getFilteredProductsReplacement);
    content = content.replace(getProductRegex, getProductReplacement);
    
    // Write the updated content back to the file
    fs.writeFileSync(useProductsPath, content, 'utf8');
    console.log('✅ Successfully applied useCallback fixes to useProducts.ts');
    return true;
  } catch (err) {
    console.error('Error fixing useProducts.ts:', err);
    return false;
  }
}

// Update build trigger to force Heroku rebuild
function updateBuildTrigger() {
  try {
    const timestamp = new Date().toISOString();
    fs.writeFileSync(buildTriggerPath, timestamp);
    console.log('✅ Build trigger file updated');
    return true;
  } catch (err) {
    console.error('Error updating build trigger:', err);
    return false;
  }
}

// Deploy to Heroku
function deployToHeroku() {
  try {
    console.log('\nInitiating Heroku deployment...');
    
    // Add the modified files to git
    execSync('git add src/hooks/useProducts.ts .build-trigger', { stdio: 'inherit' });
    
    // Commit the changes
    execSync('git commit -m "Fix: useProducts function reference churn causing infinite API requests"', { stdio: 'inherit' });
    
    // Push to Heroku
    console.log('\nPushing changes to Heroku...');
    execSync('git push heroku HEAD:main', { stdio: 'inherit' });
    
    console.log('\n✅ Successfully deployed to Heroku');
    return true;
  } catch (err) {
    console.error('\n❌ Failed to push to Heroku', err);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Function Reference Fix Deployment ===\n');
  
  console.log('Applying fix to useProducts.ts...');
  // Create backup
  if (!createBackup()) {
    console.error('❌ Cannot proceed without backup');
    process.exit(1);
  }
  
  // Apply fix
  if (!fixUseProductsFile()) {
    console.error('❌ Failed to fix useProducts.ts');
    console.log('Restoring from backup...');
    fs.copyFileSync(backupPath, useProductsPath);
    console.log('Original file restored');
    process.exit(1);
  }
  
  // Update build trigger
  if (!updateBuildTrigger()) {
    console.error('❌ Failed to update build trigger');
    process.exit(1);
  }
  
  // Deploy to Heroku
  if (!deployToHeroku()) {
    console.error('\n❌ Deployment to Heroku failed');
    process.exit(1);
  }
  
  console.log('\n✅ Fix deployed successfully!');
  console.log(`\nNext steps:\n1. Verify the fix resolves the infinite loading issue in production\n2. Update documentation with the results\n3. Consider applying similar fixes to other components that may have the same issue`);
}

// Run the script
main();
