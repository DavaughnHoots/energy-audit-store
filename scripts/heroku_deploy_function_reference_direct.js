/**
 * Script to deploy the function reference fix to Heroku using direct file replacement
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

// Fix the useProducts.ts file by direct replacement
function fixUseProductsFile() {
  try {
    // Create the fixed content with useCallback
    const fixedContent = `// src/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { Product, ProductFilters } from '../../backend/src/types/product';
import ProductService from '../services/productService';

const productService = new ProductService();

interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export function useProducts() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{
    main: string[];
    sub: { [key: string]: string[] };
  }>({ main: [], sub: {} });

  useEffect(() => {
    const initializeProducts = async () => {
      try {
        console.log('Starting product initialization...');
        const success = await productService.loadProductsFromCSV('/data/products.csv');
        console.log('Load CSV result:', success);

        if (!success) {
          throw new Error('Failed to load CSV data');
        }

        const prods = await productService.getProducts();
        console.log('Loaded products count:', prods?.length || 'undefined');

        // If no products loaded, try loading some directly for client-side usage
        if (!prods || prods.length === 0) {
          console.log('No products returned from API, loading from CSV for client-side fallback');
          await productService.loadProductsFromCSVFallback('/data/products.csv');
          // Try again to get products after loading from CSV
          const fallbackProducts = await productService.getProducts();
          if (fallbackProducts && fallbackProducts.length > 0) {
            console.log('Successfully loaded fallback products:', fallbackProducts.length);
            setProducts(fallbackProducts);
          } else {
            console.error('Failed to load products from any source');
            setProducts([]);
          }
        } else {
          setProducts(prods);
        }

        const cats = await productService.getCategories();
        console.log('Categories:', cats);

        setCategories(cats);
        setError(null);
      } catch (err) {
        console.error('Product initialization error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred loading products');
        setProducts([]);
        setCategories({ main: [], sub: {} });
      } finally {
        setIsLoading(false);
      }
    };

    initializeProducts();
  }, []);

  /**
   * Get filtered products with pagination support
   */
  const getFilteredProducts = useCallback(async (
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
  }, []);

  const getProduct = useCallback(async (id: string) => {
    try {
      return await productService.getProduct(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    products,
    categories,
    getFilteredProducts,
    getProduct
  };
}`;
    
    // Write the updated content back to the file
    fs.writeFileSync(useProductsPath, fixedContent, 'utf8');
    console.log('✅ Successfully applied useCallback fixes to useProducts.ts with direct replacement');
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
  console.log('=== Function Reference Fix Deployment (Direct Replacement) ===\n');
  
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
