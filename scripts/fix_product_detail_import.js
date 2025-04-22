/**
 * Script to fix ProductDetailModal.tsx import issues
 * 
 * This script modifies the ProductDetailModal component to fix issues
 * with importing from productImageService.ts
 */

const fs = require('fs');
const path = require('path');

console.log('Starting ProductDetailModal.tsx import fix...');

const filePath = path.join(__dirname, '../src/components/products/ProductDetailModal.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// Replace getProductImageData with getCategoryImage
content = content.replace(
  /import \{ getProductImageData, trackImageDownload \} from '\.\.\/\.\.\/services\/productImageService';/,
  "import { getCategoryImage, trackImageDownload } from '../../services/productImageService';"
);

// Replace function calls from getProductImageData to getCategoryImage
content = content.replace(
  /const imageData = await getProductImageData\(/g,
  'const imageData = await getCategoryImage('
);

// Fix the ProductImageData interface if needed
content = content.replace(
  /interface ProductImageData \{\s+url: string;\s+id: string;\s+photographer: string;\s+photographerUsername: string;\s+photographerUrl: string;\s+\}/,
  `interface ProductImageData {
  url: string;
  id?: string;
  photographer: string;
  photographerUrl: string;
}`
);

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully fixed ProductDetailModal.tsx imports!');

// Commit the changes
const commitChanges = () => {
  try {
    console.log('Adding files to git...');
    const { execSync } = require('child_process');
    execSync('git add src/components/products/ProductDetailModal.tsx', { stdio: 'inherit' });
    execSync('git commit -m "Fix import in ProductDetailModal.tsx to use getCategoryImage"', { stdio: 'inherit' });
    
    console.log('\n✅ Successfully committed ProductDetailModal.tsx fix!');
    return true;
  } catch (error) {
    console.error('\n❌ Error committing changes:', error);
    return false;
  }
};

// If this script is being executed directly (not imported), commit changes
if (require.main === module) {
  commitChanges();
}

module.exports = { commitChanges };
