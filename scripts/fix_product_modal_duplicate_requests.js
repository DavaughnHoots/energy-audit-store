/**
 * Script to fix duplicate API requests in ProductDetailModal component
 * This script removes redundant fetch implementations and adds proper request debouncing
 */

const fs = require('fs');
const path = require('path');

console.log('Starting ProductDetailModal duplicate API requests fix');

// Path to the component file
const filePath = path.join(__dirname, '../src/components/products/ProductDetailModal.tsx');

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File does not exist at path: ${filePath}`);
  process.exit(1);
}

// Read the file content
console.log(`Reading file: ${filePath}`);
let content = fs.readFileSync(filePath, 'utf8');

// Create backup
const backupPath = `${filePath}.backup`;
console.log(`Creating backup at: ${backupPath}`);
fs.writeFileSync(backupPath, content, 'utf8');

console.log('Applying fixes...');

// 1. Remove the redundant fetchProductDetails function
const oldLength = content.length;
content = content.replace(
  /const fetchProductDetails = async \(\) => \{[\s\S]*?\};\s+/,
  ''
);

// Check if the replacement did anything
if (content.length === oldLength) {
  console.log('Warning: Could not find and remove duplicate fetchProductDetails function');
} else {
  console.log('Successfully removed duplicate fetchProductDetails function');
}

// 2. Fix the useEffect implementation to add debouncing and proper cleanup
const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\}, \[isOpen, productId\]\);/;
if (useEffectRegex.test(content)) {
  content = content.replace(
    useEffectRegex,
    `useEffect(() => {
  // Only fetch if the modal is open and we have a productId
  if (isOpen && productId) {
    // Add debouncing with timeout
    const timeoutId = setTimeout(() => {
      fetchProductDetailsRef.current();
    }, 50); // 50ms debounce
    
    // Return cleanup function
    return () => {
      // Clear timeout to prevent execution after unmount
      clearTimeout(timeoutId);
      
      // Abort any in-flight requests for this product
      requestCache.abortRequest(
        API_ENDPOINTS.RECOMMENDATIONS.GET_PRODUCT_DETAIL(productId)
      );
    };
  }
}, [isOpen, productId]); // Keep dependencies minimal and correct`
  );
  console.log('Successfully updated useEffect with debouncing and cleanup');
} else {
  console.log('Warning: Could not find useEffect to update');
}

// 3. Fix any references to inFlightRequests if they exist
if (content.includes('inFlightRequests')) {
  content = content.replace(
    /const inFlightRequests = React\.useRef\(new Map\(\)\)\.current;/,
    '// Removed inFlightRequests - using requestCache instead'
  );
  console.log('Fixed inFlightRequests reference');
}

// Write the updated content back to the file
console.log(`Writing updated content to: ${filePath}`);
fs.writeFileSync(filePath, content, 'utf8');

// Trigger .build-trigger update to ensure Heroku rebuilds the app
const buildTriggerPath = path.join(__dirname, '../.build-trigger');
console.log(`Updating build trigger at: ${buildTriggerPath}`);
fs.writeFileSync(buildTriggerPath, new Date().toISOString(), 'utf8');

console.log('Fix completed successfully!');
console.log('ProductDetailModal.tsx has been updated to fix duplicate API requests');
console.log('.build-trigger updated to force Heroku rebuild');
