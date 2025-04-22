/**
 * Script to fix function reference churn in useProducts.ts
 * This addresses the infinite loading issue in the ProductGallery component
 */

const fs = require('fs');
const path = require('path');

// File paths
const useProductsPath = path.join(__dirname, '../src/hooks/useProducts.ts');
const backupPath = `${useProductsPath}.backup-${Date.now()}`;

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

// Main function
function main() {
  console.log('=== Fixing function reference churn in useProducts.ts ===');
  
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
  
  console.log('\n✅ Fix applied successfully!');
  console.log(`\nNext steps:\n1. Test the fix locally\n2. Deploy to Heroku using the deployment script\n3. Verify the fix resolves the infinite loading issue`);
}

// Run the script
main();
