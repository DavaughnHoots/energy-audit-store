/**
 * Script to fix the missing fetchProductDetailsRef in ProductDetailModal
 */

const fs = require('fs');
const path = require('path');

// File paths
const modalPath = path.join(__dirname, '../src/components/products/ProductDetailModal.tsx');
const backupPath = `${modalPath}.backup-${Date.now()}`;

// Create backup of original file
function createBackup() {
  try {
    fs.copyFileSync(modalPath, backupPath);
    console.log(`Created backup at ${path.basename(backupPath)}`);
    return true;
  } catch (err) {
    console.error('Error creating backup:', err);
    return false;
  }
}

// Fix the ProductDetailModal component
function fixModalComponent() {
  try {
    // Read the original file
    let content = fs.readFileSync(modalPath, 'utf8');
    
    // Find the imports section
    const importsSection = content.match(/import[\s\S]+?;\n/g);
    if (!importsSection) {
      console.error('Could not find imports section');
      return false;
    }
    
    // Update imports to include useRef and requestCache
    let updatedImports = importsSection.join('');
    if (!updatedImports.includes('useRef')) {
      updatedImports = updatedImports.replace(
        'import React, { useState, useEffect } from \'react\';',
        'import React, { useState, useEffect, useRef } from \'react\';'
      );
    }
    
    // Add import for requestCache if not present
    if (!updatedImports.includes('requestCache')) {
      updatedImports += "import { requestCache } from '../../../utils/requestCache';\n";
    }
    
    // Add import for getCategoryImage
    if (content.includes('getCategoryImage') && !updatedImports.includes('getCategoryImage')) {
      updatedImports = updatedImports.replace(
        'import { getProductImageData, trackImageDownload } from \'@/services/productImageService\';',
        'import { getProductImageData, trackImageDownload, getCategoryImage } from \'@/services/productImageService\';'
      );
    }
    
    // Replace imports
    content = content.replace(importsSection.join(''), updatedImports);
    
    // Add fetchProductDetailsRef declaration after the state declarations
    if (!content.includes('fetchProductDetailsRef')) {
      const stateDeclarations = content.match(/const \[\w+, set\w+\] = useState[\s\S]+?;/g);
      if (stateDeclarations) {
        const lastStateDeclaration = stateDeclarations[stateDeclarations.length - 1];
        content = content.replace(
          lastStateDeclaration,
          `${lastStateDeclaration}\n  // Ref to track fetch operations and prevent duplicates\n  const fetchProductDetailsRef = useRef(async () => {\n    try {\n      setLoading(true);\n      setError(null);\n      \n      // Simulated API call for now - replace with actual implementation\n      const response = await fetch(`/api/products/${productId}`);\n      if (!response.ok) {\n        throw new Error('Failed to load product details');\n      }\n      \n      const productData = await response.json();\n      setProduct(productData);\n    } catch (err) {\n      console.error('Error loading product details:', err);\n      setError(err instanceof Error ? err.message : 'Failed to load product details');\n    } finally {\n      setLoading(false);\n    }\n  });\n`
        );
      } else {
        console.error('Could not find state declarations to add fetchProductDetailsRef');
        return false;
      }
    }
    
    // Add fetchProductDetails function if it's missing and referenced
    if (content.includes('onClick={fetchProductDetails}') && !content.includes('const fetchProductDetails =')) {
      // Find a good spot to inject the function
      const useEffectEndIndex = content.indexOf('}, [isOpen, productId])');
      if (useEffectEndIndex > 0) {
        const insertPoint = content.indexOf('\n', useEffectEndIndex) + 1;
        content = content.slice(0, insertPoint) + 
          `\n  // Function to manually trigger product details fetch\n  const fetchProductDetails = () => {\n    fetchProductDetailsRef.current();\n  };\n` + 
          content.slice(insertPoint);
      } else {
        console.error('Could not find a good location to add fetchProductDetails function');
        return false;
      }
    }
    
    // Mock requestCache utility if import was added but it doesn't exist
    const utilsPath = path.join(__dirname, '../src/utils');
    const requestCachePath = path.join(utilsPath, 'requestCache.ts');
    
    if (!fs.existsSync(requestCachePath) && updatedImports.includes('requestCache')) {
      // Create utils directory if it doesn't exist
      if (!fs.existsSync(utilsPath)) {
        fs.mkdirSync(utilsPath, { recursive: true });
      }
      
      // Create a simple requestCache utility
      const requestCacheContent = `/**\n * Simple utility to manage and abort API requests\n */\n\ntype AbortableRequests = {\n  [key: string]: AbortController;\n};\n\nclass RequestCache {\n  private abortControllers: AbortableRequests = {};\n  \n  /**\n   * Create a new abort controller for a request\n   */\n  public getAbortController(requestKey: string): AbortController {\n    // Cancel existing request with the same key if it exists\n    this.abortRequest(requestKey);\n    \n    // Create a new controller\n    const controller = new AbortController();\n    this.abortControllers[requestKey] = controller;\n    \n    return controller;\n  }\n  \n  /**\n   * Abort a request by key\n   */\n  public abortRequest(requestKey: string): void {\n    if (this.abortControllers[requestKey]) {\n      try {\n        this.abortControllers[requestKey].abort();\n      } catch (error) {\n        console.error('Error aborting request:', error);\n      }\n      \n      // Remove the aborted controller\n      delete this.abortControllers[requestKey];\n    }\n  }\n  \n  /**\n   * Abort all tracked requests\n   */\n  public abortAllRequests(): void {\n    Object.keys(this.abortControllers).forEach(key => {\n      this.abortRequest(key);\n    });\n  }\n}\n\nexport const requestCache = new RequestCache();\n`;
      
      fs.writeFileSync(requestCachePath, requestCacheContent, 'utf8');
      console.log(`Created requestCache utility at ${path.relative(process.cwd(), requestCachePath)}`);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(modalPath, content, 'utf8');
    console.log('✅ Successfully updated ProductDetailModal with fetchProductDetailsRef');
    return true;
  } catch (err) {
    console.error('Error fixing ProductDetailModal:', err);
    return false;
  }
}

// Main function
function main() {
  console.log('=== Fixing ProductDetailModal Component ===');
  
  // Create backup
  if (!createBackup()) {
    console.error('❌ Cannot proceed without backup');
    process.exit(1);
  }
  
  // Apply fix
  if (!fixModalComponent()) {
    console.error('❌ Failed to fix ProductDetailModal');
    console.log('Restoring from backup...');
    fs.copyFileSync(backupPath, modalPath);
    console.log('Original file restored');
    process.exit(1);
  }
  
  console.log('\n✅ Fix applied successfully!');
}

// Run the script
main();
