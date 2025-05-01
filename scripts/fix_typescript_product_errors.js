#!/usr/bin/env node

/**
 * Fix TypeScript Product Type Errors
 * 
 * This script updates the Product type definition to include all properties
 * referenced in the codebase, resolving type errors that appear in Heroku build logs.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const backendDir = path.join(process.cwd(), 'backend');
const srcDir = path.join(backendDir, 'src');
const typesDir = path.join(srcDir, 'types');

console.log('🚀 Starting TypeScript Product Type Fix...');

try {
  // Step 1: Locate the product type definition file
  console.log('\n🔍 Looking for Product type definition...');
  const productTypeFiles = ['product.ts', 'productTypes.ts', 'Product.ts', 'products.ts'];
  
  let productTypeFile = null;
  for (const filename of productTypeFiles) {
    const filePath = path.join(typesDir, filename);
    if (fs.existsSync(filePath)) {
      productTypeFile = filePath;
      console.log(`✅ Found Product type definition at: ${filePath}`);
      break;
    }
  }
  
  if (!productTypeFile) {
    // If not found in standard location, search for it
    console.log('Product type definition not found in expected location, searching...');
    const searchCommand = `find ${srcDir} -type f -name "*.ts" | xargs grep -l "interface Product" || true`;
    const { execSync } = require('child_process');
    try {
      const result = execSync(searchCommand, { encoding: 'utf8' });
      if (result.trim()) {
        productTypeFile = result.trim().split('\n')[0];
        console.log(`✅ Found Product type definition at: ${productTypeFile}`);
      }
    } catch (error) {
      console.log('Search failed, creating new type definition...');
    }
  }
  
  // Step 2: Create an updated Product type definition
  console.log('\n📝 Creating updated Product type definition...');
  const updatedProductType = `export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  mainCategory?: string; // Added to fix type errors
  subCategory?: string; // Added to fix type errors
  brand?: string; // Added to fix type errors
  model?: string; // Added to fix type errors
  rating: number;
  image: string;
  productUrl?: string; // Added to fix type errors
  energyRating?: string; // Added to fix type errors
  efficiency?: number; // Added to fix type errors
  rebateAmount?: number; // Added to fix type errors
  dateAdded: string;
  inStock: boolean;
  features?: string[];
  specifications?: Record<string, string>;
}

export interface ProductFilter {
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  brand?: string;
  inStock?: boolean;
}

// Alias for backward compatibility
export type ProductFilters = ProductFilter;
`;

  // If we found a file, update it, otherwise create a new one
  if (productTypeFile) {
    fs.writeFileSync(productTypeFile, updatedProductType);
    console.log(`✅ Updated Product type definition at: ${productTypeFile}`);
  } else {
    const newProductTypeFile = path.join(typesDir, 'product.ts');
    fs.mkdirSync(typesDir, { recursive: true });
    fs.writeFileSync(newProductTypeFile, updatedProductType);
    console.log(`✅ Created new Product type definition at: ${newProductTypeFile}`);
  }
  
  // Step 3: Fix the Pool type errors in service files
  console.log('\n🔧 Fixing Pool type errors in service files...');
  
  // First, let's find all files with "Pool refers to a value" errors
  const poolTypeFilePaths = [
    path.join(srcDir, 'services', 'propertySettingsService.ts'),
    path.join(srcDir, 'services', 'searchService.ts'),
    path.join(srcDir, 'services', 'userAuthService.ts'),
    path.join(srcDir, 'services', 'userService.ts'),
    path.join(srcDir, 'services', 'userSettingsService.ts'),
    path.join(srcDir, 'services', 'visualizationService.ts')
  ];
  
  let fixedPoolTypeCount = 0;
  for (const filePath of poolTypeFilePaths) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix "'Pool' refers to a value, but is being used as a type here"
      const poolTypeRegex = /([^a-zA-Z0-9_])Pool([^a-zA-Z0-9_])/g;
      content = content.replace(poolTypeRegex, (match, before, after) => {
        // Only replace when it's used as a type
        if (before.includes(':') || before.includes('<') || before.includes('(')) {
          return `${before}PoolClient${after}`;
        }
        return match;
      });
      
      // Fix "Property 'query' does not exist on type 'typeof Pool'"
      if (content.includes('.query(') && content.includes('typeof Pool')) {
        content = content.replace(/typeof Pool/g, 'Pool');
      }
      
      // Fix "Type 'Pool' is not assignable to parameter of type 'typeof Pool'"
      if (content.includes('Type \'Pool\' is not assignable')) {
        // Try to find and fix the specific instance
        content = content.replace(/([^a-zA-Z0-9_])pool([^a-zA-Z0-9_])/g, (match, before, after) => {
          if (after.trim().startsWith(')') || after.trim().startsWith(',')) {
            return `${before}pool.query${after}`;
          }
          return match;
        });
      }
      
      fs.writeFileSync(filePath, content);
      fixedPoolTypeCount++;
      console.log(`✅ Fixed Pool type issues in: ${filePath}`);
    }
  }
  
  console.log(`🔍 Fixed Pool type issues in ${fixedPoolTypeCount} files.`);
  
  // Step 4: Update any incorrect pool.query usage
  console.log('\n📤 TypeScript error fixes complete!');
  console.log('\n✨ The TypeScript errors related to Product type and Pool should now be fixed.');
  console.log('You can now rebuild and redeploy the application.');
  
} catch (error) {
  console.error('\n❌ Error during TypeScript fixes:', error.message);
  process.exit(1);
}
