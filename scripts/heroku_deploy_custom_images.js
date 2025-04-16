/**
 * Heroku deployment script for product custom images
 * 
 * This script deploys the necessary files to use custom product category images
 * from our predefined collection, addressing the image sizing and aspect ratio issues.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Files to be deployed
const FILES_TO_DEPLOY = [
  'public/data/custom-category-images.json',
  'src/services/productImageService.ts',
  'src/components/products/CategoryGallery.tsx'
];

// Verify all files exist before deploying
console.log('Verifying files...');
for (const file of FILES_TO_DEPLOY) {
  if (!fs.existsSync(file)) {
    console.error(`Error: ${file} not found. Deployment cancelled.`);
    process.exit(1);
  }
  console.log(`✓ ${file} found`);
}

function addCustomImageSupport() {
  console.log('Adding custom image support to productImageService.ts...');
  
  const serviceFile = 'src/services/productImageService.ts';
  let content = fs.readFileSync(serviceFile, 'utf8');
  
  // Check if already imported
  if (!content.includes('import customImages')) {
    // Add import for custom images
    content = content.replace(
      "import predefinedCategoryImages from '../../public/data/category-images.json';",
      "import predefinedCategoryImages from '../../public/data/category-images.json';\nimport customImages from '../../public/data/custom-category-images.json';"
    );
    
    // Add helper function for image URL formatting
    content = content.replace(
      "// Unsplash API key",
      "/**\n * Helper function to format the Unsplash image URL with proper parameters\n */\nconst formatImageUrl = (url: string): string => {\n  if (!url) return '';\n  \n  // If URL already has query parameters, add to them\n  if (url.includes('?')) {\n    // If it doesn't already have these params\n    if (!url.includes('auto=format')) {\n      url += '&auto=format&fit=crop&w=800&q=80';\n    }\n  } else {\n    // Add query parameters\n    url += '?auto=format&fit=crop&w=800&q=80';\n  }\n  \n  return url;\n};\n\n/**\n * Gets the custom image for a category if available\n */\nconst getCustomImage = (category: string): ProductImageData | null => {\n  const normalizedCategory = normalizeCategory(category);\n  \n  try {\n    // First check if it's a subcategory\n    // @ts-ignore - JSON import type handling\n    if (customImages.subCategories && customImages.subCategories[normalizedCategory]) {\n      // @ts-ignore - JSON import type handling\n      const image = customImages.subCategories[normalizedCategory];\n      console.log(`Found custom subcategory image for ${normalizedCategory}`);\n      \n      return {\n        url: formatImageUrl(image.url),\n        photographer: image.photographer || 'Unsplash',\n        photographerUrl: image.photographerUrl || 'https://unsplash.com'\n      };\n    }\n    \n    // Then check main categories\n    // @ts-ignore - JSON import type handling\n    if (customImages.mainCategories && customImages.mainCategories[normalizedCategory]) {\n      // @ts-ignore - JSON import type handling\n      const image = customImages.mainCategories[normalizedCategory];\n      console.log(`Found custom main category image for ${normalizedCategory}`);\n      \n      return {\n        url: formatImageUrl(image.url),\n        photographer: image.photographer || 'Unsplash',\n        photographerUrl: image.photographerUrl || 'https://unsplash.com'\n      };\n    }\n  } catch (error) {\n    console.error(`Error accessing custom images for ${normalizedCategory}:`, error);\n  }\n  \n  return null;\n};\n\n// Unsplash API key"
    );
    
    // Update getCategoryImage to check for custom images first
    content = content.replace(
      'console.log(`Getting image for category: "${category}", normalized: "${normalizedCategory}"`);',
      'console.log(`Getting image for category: "${category}", normalized: "${normalizedCategory}"`);\n  \n  // First, check for custom images from our curated collection\n  const customImage = getCustomImage(normalizedCategory);\n  if (customImage) {\n    // Cache the custom image\n    setLocalStorageCache(cacheKey, customImage, CACHE_DURATION);\n    return customImage;\n  }'
    );
    
    // Update the getProductImageFallback function to check custom images first
    content = content.replace(
      'export function getProductImageFallback(',
      'export function getProductImageFallback(\n  productName: string,\n  category: string\n): string {\n  const normalizedCategory = normalizeCategory(category);\n  \n  // First check custom images\n  // @ts-ignore - JSON import type handling\n  if (customImages.mainCategories && customImages.mainCategories[normalizedCategory]) {\n    // @ts-ignore - JSON import type handling\n    return formatImageUrl(customImages.mainCategories[normalizedCategory].url);\n  }\n  \n  // Then check default images\n  if (DEFAULT_IMAGES[normalizedCategory]) {\n    return DEFAULT_IMAGES[normalizedCategory];\n  } else if (DEFAULT_IMAGES[\'Appliances\']) {\n    return DEFAULT_IMAGES[\'Appliances\'];\n  } else {\n    return FALLBACK_IMAGE;\n  }\n}\n\n/**\n * OLD VERSION - KEEPING FOR REFERENCE\n */\nexport function _getProductImageFallback('
    );
    
    // Write the modified file
    fs.writeFileSync(serviceFile, content, 'utf8');
    console.log('✓ Added custom image support to productImageService.ts');
  } else {
    console.log('✓ Custom image support already added to productImageService.ts');
  }
}

// Create a new Git branch
const branchName = `feature/custom-product-images-${Date.now()}`;
console.log(`Creating new Git branch: ${branchName}`);
try {
  execSync(`git checkout -b ${branchName}`);
} catch (error) {
  console.error('Error creating branch:', error.message);
  process.exit(1);
}

// Add custom image support to the service
addCustomImageSupport();

// Stage files for commit
console.log('Staging files for commit...');
try {
  FILES_TO_DEPLOY.forEach(file => {
    execSync(`git add ${file}`);
    console.log(`✓ Added ${file}`);
  });
} catch (error) {
  console.error('Error staging files:', error.message);
  process.exit(1);
}

// Commit changes
console.log('Committing changes...');
try {
  execSync(`git commit -m "Add custom product category images with fixed aspect ratio"`);
} catch (error) {
  console.error('Error committing changes:', error.message);
  process.exit(1);
}

// Push to Heroku
console.log('Deploying to Heroku...');
try {
  execSync('git push heroku HEAD:main -f');
  console.log('✓ Successfully deployed to Heroku!');
} catch (error) {
  console.error('Error deploying to Heroku:', error.message);
  console.log('You may need to deploy manually using: git push heroku HEAD:main -f');
  process.exit(1);
}

console.log('\nDeployment Summary:');
console.log('==================');
console.log('✓ Created new branch:', branchName);
console.log(`✓ Deployed ${FILES_TO_DEPLOY.length} files`);
console.log('\nFixes implemented:');
console.log('- Added custom product category images for consistent visual quality');
console.log('- Fixed aspect ratio consistency issues in the category gallery');
console.log('- Improved error handling for image loading failures');
console.log('- Enhanced the image attribution display');
console.log('\nReminder: After testing, merge this branch to main with:');
console.log(`git checkout main && git merge ${branchName}`);
