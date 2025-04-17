/**
 * Image URL Diagnostic Tool
 * 
 * This script checks all image URLs in custom-category-images.json to identify which ones are failing
 * and why. It outputs a report that can be used to fix the issues.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Read the custom category images JSON file
const filePath = path.join(__dirname, '../public/data/custom-category-images.json');
const customImagesJson = fs.readFileSync(filePath, 'utf8');
const customImages = JSON.parse(customImagesJson);

// Create a function to test a URL
function checkUrl(url, category, type) {
  return new Promise((resolve) => {
    // If URL doesn't have a protocol, assume https
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    
    // Add query parameters if the URL is from Unsplash and doesn't already have them
    if (url.includes('images.unsplash.com') && !url.includes('?')) {
      url += '?auto=format&fit=crop&w=800&q=80';
    }
    
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, (res) => {
      const { statusCode } = res;
      
      // Consume response data to free up memory
      res.resume();
      
      resolve({
        url,
        category,
        type,
        statusCode,
        status: statusCode >= 200 && statusCode < 400 ? 'OK' : 'FAIL',
        error: statusCode >= 400 ? `HTTP Error ${statusCode}` : null
      });
    });
    
    req.on('error', (e) => {
      resolve({
        url,
        category,
        type,
        status: 'FAIL',
        error: e.message
      });
    });
    
    // Set timeout to 5 seconds
    req.setTimeout(5000, () => {
      req.abort();
      resolve({
        url,
        category,
        type,
        status: 'FAIL',
        error: 'Request timed out'
      });
    });
  });
}

// Main function to check all URLs
async function checkAllUrls() {
  const results = [];
  const failedUrls = [];
  
  console.log('Checking main category images...');
  
  // Check main category images
  for (const [category, data] of Object.entries(customImages.mainCategories)) {
    const result = await checkUrl(data.url, category, 'Main Category');
    results.push(result);
    
    if (result.status === 'FAIL') {
      failedUrls.push(result);
    }
    
    console.log(`${category}: ${result.status}${result.error ? ' - ' + result.error : ''}`);
  }
  
  console.log('\nChecking subcategory images...');
  
  // Check subcategory images
  for (const [subCategory, data] of Object.entries(customImages.subCategories)) {
    const result = await checkUrl(data.url, subCategory, 'Subcategory');
    results.push(result);
    
    if (result.status === 'FAIL') {
      failedUrls.push(result);
    }
    
    console.log(`${subCategory}: ${result.status}${result.error ? ' - ' + result.error : ''}`);
  }
  
  // Print summary
  console.log('\n=== SUMMARY ===');
  console.log(`Total URLs checked: ${results.length}`);
  console.log(`Working URLs: ${results.filter(r => r.status === 'OK').length}`);
  console.log(`Failed URLs: ${failedUrls.length}`);
  
  if (failedUrls.length > 0) {
    console.log('\n=== FAILED URLS ===');
    failedUrls.forEach(result => {
      console.log(`${result.type} - ${result.category}: ${result.url}`);
      console.log(`  Error: ${result.error}\n`);
    });
    
    // Generate fixed URLs for Unsplash
    console.log('\n=== FIXED UNSPLASH URLS ===');
    const unsplashFixes = failedUrls
      .filter(r => r.url.includes('images.unsplash.com'))
      .map(r => {
        // Ensure URL has correct query parameters
        let fixedUrl = r.url;
        if (!fixedUrl.includes('?')) {
          fixedUrl += '?auto=format&fit=crop&w=800&q=80';
        }
        return {
          ...r,
          fixedUrl
        };
      });
    
    unsplashFixes.forEach(result => {
      console.log(`${result.type} - ${result.category}:`);
      console.log(`  Original: ${result.url}`);
      console.log(`  Fixed: ${result.fixedUrl}\n`);
    });
  }
  
  // Output for category image formatting issues
  console.log('\n=== RECOMMENDATIONS ===');
  console.log('1. For Unsplash URLs, ensure they include query parameters: ?auto=format&fit=crop&w=800&q=80');
  console.log('2. Consider using embedded base64 SVG placeholders for categories with consistently failing images');
  console.log('3. Check browser console for CORS errors, which may indicate Unsplash policy changes');
  console.log('4. Clear localStorage image cache in the browser to ensure latest URLs are used');
}

// Run the main function
checkAllUrls().catch(console.error);
