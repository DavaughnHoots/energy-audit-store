/**
 * Fix Image Loading Issues and Deploy
 * 
 * This script performs several fixes for image loading issues:
 * 1. Updates image URLs with correct query parameters
 * 2. Deploys diagnostic tools
 * 3. Ensures proper URL format for all image sources
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting image loading fixes deployment...');

// Update build trigger for Heroku
const buildTriggerPath = path.join(__dirname, '../.build-trigger');
fs.writeFileSync(buildTriggerPath, new Date().toISOString(), 'utf8');
console.log('Updated build trigger for Heroku deployment');

// 1. Fix image URLs in custom-category-images.json
const fixCustomImagesUrls = () => {
  console.log('\nFixing image URLs in custom-category-images.json...');
  const filePath = path.join(__dirname, '../public/data/custom-category-images.json');
  let customImages;
  
  try {
    const customImagesJson = fs.readFileSync(filePath, 'utf8');
    customImages = JSON.parse(customImagesJson);
    let fixCount = 0;

    // Fix main category image URLs
    Object.keys(customImages.mainCategories).forEach(category => {
      const data = customImages.mainCategories[category];
      if (data.url && data.url.includes('images.unsplash.com') && !data.url.includes('?')) {
        data.url = `${data.url}?auto=format&fit=crop&w=800&q=80`;
        fixCount++;
      }
    });

    // Fix subcategory image URLs
    Object.keys(customImages.subCategories).forEach(subCategory => {
      const data = customImages.subCategories[subCategory];
      if (data.url && data.url.includes('images.unsplash.com') && !data.url.includes('?')) {
        data.url = `${data.url}?auto=format&fit=crop&w=800&q=80`;
        fixCount++;
      }
    });

    // Write back the fixed file
    fs.writeFileSync(filePath, JSON.stringify(customImages, null, 2), 'utf8');
    console.log(`Fixed ${fixCount} Unsplash image URLs in custom-category-images.json`);
    return true;
  } catch (error) {
    console.error('Error fixing custom images file:', error);
    return false;
  }
};

// 2. Create a helper index file for accessing the clear cache tool
const createClearCacheIndex = () => {
  console.log('\nCreating helper index for clear cache tool...');
  const filePath = path.join(__dirname, '../public/clear-cache-index.html');
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Energy Audit Store - Utilities</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #2e7d32;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
    }
    .card {
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      background: #4caf50;
      color: white;
      padding: 10px 15px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .btn:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <h1>Energy Audit Store Utilities</h1>
  
  <div class="card">
    <h2>Image Cache Tool</h2>
    <p>If you're experiencing issues with images not displaying correctly, use this tool to clear your browser's image cache.</p>
    <a href="/clear_cache.html" class="btn">Clear Image Cache</a>
  </div>
  
  <div class="card">
    <h2>Back to Main Application</h2>
    <p>Return to the main Energy Audit Store application.</p>
    <a href="/" class="btn">Go to Application</a>
  </div>
</body>
</html>`;

  try {
    fs.writeFileSync(filePath, htmlContent, 'utf8');
    console.log('Created clear cache index page at: /clear-cache-index.html');
    return true;
  } catch (error) {
    console.error('Error creating clear cache index:', error);
    return false;
  }
};

// 3. Deploy all changes to Heroku
const deployToHeroku = () => {
  console.log('\nDeploying changes to Heroku...');
  
  try {
    // Add changes to git
    execSync('git add public/clear_cache.html', { stdio: 'inherit' });
    execSync('git add public/clear_image_cache.js', { stdio: 'inherit' });
    execSync('git add public/clear-cache-index.html', { stdio: 'inherit' });
    execSync('git add scripts/diagnose_image_urls.js', { stdio: 'inherit' });
    execSync('git add scripts/fix_image_loading_and_deploy.js', { stdio: 'inherit' });
    execSync('git add public/data/custom-category-images.json', { stdio: 'inherit' });
    execSync('git add .build-trigger', { stdio: 'inherit' });
    
    // Commit the changes
    execSync('git commit -m "Fix image loading issues and add diagnostic tools"', { stdio: 'inherit' });
    
    // Push to GitHub
    execSync('git push', { stdio: 'inherit' });
    
    // Push to Heroku
    execSync('git push heroku main', { stdio: 'inherit' });
    
    console.log('Successfully deployed changes to Heroku!');
    return true;
  } catch (error) {
    console.error('Error deploying to Heroku:', error);
    return false;
  }
};

// Execute all fixes
const main = async () => {
  console.log('Starting image loading fixes...');
  
  // Fix custom images URLs
  const customImagesFixed = fixCustomImagesUrls();
  
  // Create helper index
  const indexCreated = createClearCacheIndex();
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Custom images URLs fixed: ${customImagesFixed ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Helper index created: ${indexCreated ? 'SUCCESS' : 'FAILED'}`);
  
  if (customImagesFixed && indexCreated) {
    console.log('\nAll fixes completed successfully!');
    console.log('\nReady to deploy? Run these commands:');
    console.log('1. git add public/clear_cache.html');
    console.log('2. git add public/clear_image_cache.js');
    console.log('3. git add public/clear-cache-index.html');
    console.log('4. git add scripts/diagnose_image_urls.js');
    console.log('5. git add scripts/fix_image_loading_and_deploy.js');
    console.log('6. git add public/data/custom-category-images.json');
    console.log('7. git add .build-trigger');
    console.log('8. git commit -m "Fix image loading issues and add diagnostic tools"');
    console.log('9. git push');
    console.log('10. git push heroku main');
    
    const shouldDeploy = false; // Set to true to auto-deploy
    
    if (shouldDeploy) {
      console.log('\nAuto-deploying to Heroku...');
      deployToHeroku();
    }
  } else {
    console.log('\nSome fixes failed. Please check the logs above.');
  }
};

// Run the main function
main().catch(console.error);
