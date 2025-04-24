/**
 * web-inspect.js
 * 
 * This script helps inspect the Heroku app via HTTP requests
 * to understand the structure of the admin dashboard
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration
const APP_URL = 'energy-audit-store-e66479ed4f2b.herokuapp.com';
const SAVE_DIR = path.join(__dirname, 'app-analysis');

/**
 * Print a formatted message
 */
function print(message, color = 'reset', isBright = false) {
  const bright = isBright ? colors.bright : '';
  console.log(`${bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Create a directory if it doesn't exist
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  }
  return false;
}

/**
 * Make a HTTPS request and return the response
 */
function httpsGet(hostname, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        ...headers
      }
    };

    print(`Requesting: https://${hostname}${path}`, 'dim');
    
    const req = https.request(options, (res) => {
      let data = '';
      
      // Log status
      print(`Status: ${res.statusCode}`, res.statusCode === 200 ? 'green' : 'yellow');
      
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        const location = res.headers.location;
        print(`Redirect to: ${location}`, 'yellow');
        
        // If redirected to same host, follow
        if (location.includes(hostname)) {
          const redirectPath = location.split(hostname)[1];
          return httpsGet(hostname, redirectPath)
            .then(resolve)
            .catch(reject);
        } else {
          print(`Cross-domain redirect not followed`, 'yellow');
        }
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', (e) => {
      print(`Request error: ${e.message}`, 'red');
      reject(e);
    });
    
    req.end();
  });
}

/**
 * Save response data to file
 */
function saveToFile(filename, data) {
  const filePath = path.join(SAVE_DIR, filename);
  fs.writeFileSync(filePath, data);
  print(`Saved to: ${filePath}`, 'green');
  return filePath;
}

/**
 * Extract JS file URLs from HTML
 */
function extractJsUrls(html) {
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/g;
  const urls = [];
  let match;
  
  while ((match = scriptRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

/**
 * Extract CSS file URLs from HTML
 */
function extractCssUrls(html) {
  const linkRegex = /<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/g;
  const urls = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

/**
 * Process and download script files
 */
async function processScriptFiles(jsUrls) {
  print('\nProcessing script files:', 'blue', true);
  const jsDir = path.join(SAVE_DIR, 'js');
  ensureDir(jsDir);
  
  for (const url of jsUrls) {
    try {
      // Skip external scripts
      if (url.startsWith('http') && !url.includes(APP_URL)) {
        print(`Skipping external script: ${url}`, 'yellow');
        continue;
      }
      
      // Determine path and filename
      let scriptPath;
      let scriptFilename;
      
      if (url.startsWith('http') && url.includes(APP_URL)) {
        const urlObj = new URL(url);
        scriptPath = urlObj.pathname;
        scriptFilename = path.basename(scriptPath);
      } else if (url.startsWith('/')) {
        scriptPath = url;
        scriptFilename = path.basename(url);
      } else {
        scriptPath = '/' + url;
        scriptFilename = path.basename(url);
      }
      
      // Download the script
      print(`Downloading: ${scriptFilename}`, 'cyan');
      const response = await httpsGet(APP_URL, scriptPath);
      
      // Save if successful
      if (response.statusCode === 200) {
        const filePath = path.join(jsDir, scriptFilename);
        fs.writeFileSync(filePath, response.data);
        print(`✓ Saved: ${scriptFilename}`, 'green');
      } else {
        print(`✗ Failed to download: ${scriptFilename}`, 'red');
      }
    } catch (error) {
      print(`Error processing script: ${url}: ${error.message}`, 'red');
    }
  }
}

/**
 * Process and download CSS files
 */
async function processCssFiles(cssUrls) {
  print('\nProcessing CSS files:', 'blue', true);
  const cssDir = path.join(SAVE_DIR, 'css');
  ensureDir(cssDir);
  
  for (const url of cssUrls) {
    try {
      // Skip external stylesheets
      if (url.startsWith('http') && !url.includes(APP_URL)) {
        print(`Skipping external stylesheet: ${url}`, 'yellow');
        continue;
      }
      
      // Determine path and filename
      let cssPath;
      let cssFilename;
      
      if (url.startsWith('http') && url.includes(APP_URL)) {
        const urlObj = new URL(url);
        cssPath = urlObj.pathname;
        cssFilename = path.basename(cssPath);
      } else if (url.startsWith('/')) {
        cssPath = url;
        cssFilename = path.basename(url);
      } else {
        cssPath = '/' + url;
        cssFilename = path.basename(url);
      }
      
      // Download the stylesheet
      print(`Downloading: ${cssFilename}`, 'cyan');
      const response = await httpsGet(APP_URL, cssPath);
      
      // Save if successful
      if (response.statusCode === 200) {
        const filePath = path.join(cssDir, cssFilename);
        fs.writeFileSync(filePath, response.data);
        print(`✓ Saved: ${cssFilename}`, 'green');
      } else {
        print(`✗ Failed to download: ${cssFilename}`, 'red');
      }
    } catch (error) {
      print(`Error processing stylesheet: ${url}: ${error.message}`, 'red');
    }
  }
}

/**
 * Look for admin dashboard related code
 */
function analyzeForAdminCode() {
  print('\nAnalyzing for admin dashboard code:', 'blue', true);
  const jsDir = path.join(SAVE_DIR, 'js');
  
  if (!fs.existsSync(jsDir)) {
    print('JavaScript directory not found', 'red');
    return;
  }
  
  const files = fs.readdirSync(jsDir);
  const adminRelatedCode = [];
  
  for (const file of files) {
    const filePath = path.join(jsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Look for admin dashboard related code
    if (
      content.includes('AdminDashboard') || 
      content.includes('admin/dashboard') ||
      content.includes('Roadmap') ||
      content.includes('roadmap') ||
      content.includes('analytics')
    ) {
      adminRelatedCode.push({
        file,
        path: filePath,
        matches: {
          adminDashboard: content.includes('AdminDashboard'),
          adminDashboardPath: content.includes('admin/dashboard'),
          roadmap: content.includes('Roadmap') || content.includes('roadmap'),
          analytics: content.includes('analytics')
        }
      });
    }
  }
  
  // Save results
  const resultsPath = path.join(SAVE_DIR, 'admin-code-analysis.json');
  fs.writeFileSync(resultsPath, JSON.stringify(adminRelatedCode, null, 2));
  print(`Found ${adminRelatedCode.length} files with admin-related code`, 'green');
  print(`Analysis saved to: ${resultsPath}`, 'green');
  
  return adminRelatedCode;
}

/**
 * Main function
 */
async function main() {
  print('==============================================', 'blue', true);
  print('     HEROKU APP WEB INSPECTION UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print(`This script will inspect the Heroku app at: ${APP_URL}\n`, 'cyan');
  
  // Create output directory
  ensureDir(SAVE_DIR);
  
  try {
    // 1. Get admin dashboard page
    print('Fetching admin dashboard page...', 'blue', true);
    const dashboardResponse = await httpsGet(APP_URL, '/admin/dashboard');
    
    if (dashboardResponse.statusCode !== 200) {
      print('Failed to fetch admin dashboard. You might need to be logged in.', 'red', true);
      print('Try manually examining the page while logged in.', 'yellow');
      return;
    }
    
    // Save the HTML
    const htmlPath = saveToFile('admin-dashboard.html', dashboardResponse.data);
    
    // 2. Extract JS and CSS URLs
    const jsUrls = extractJsUrls(dashboardResponse.data);
    print(`Found ${jsUrls.length} JavaScript files`, 'green');
    
    const cssUrls = extractCssUrls(dashboardResponse.data);
    print(`Found ${cssUrls.length} CSS files`, 'green');
    
    // Save URLs for reference
    saveToFile('js-urls.json', JSON.stringify(jsUrls, null, 2));
    saveToFile('css-urls.json', JSON.stringify(cssUrls, null, 2));
    
    // 3. Process JS and CSS files
    await processScriptFiles(jsUrls);
    await processCssFiles(cssUrls);
    
    // 4. Analyze for admin dashboard code
    const adminCode = analyzeForAdminCode();
    
    // 5. Open the HTML in browser
    print('\nInspection complete!', 'green', true);
    print('You can find all the files in:', 'cyan');
    print(SAVE_DIR, 'cyan');
    
    print('\nTo open the saved admin dashboard HTML in your browser:', 'cyan');
    print(`start ${htmlPath}`, 'dim');
    
    if (adminCode?.length > 0) {
      print('\nFiles with admin dashboard related code:', 'green');
      adminCode.forEach(item => {
        print(`- ${item.file}`, 'cyan');
      });
    }
    
  } catch (error) {
    print(`An error occurred: ${error.message}`, 'red', true);
  }
}

// Run the script
main().catch(error => {
  print(`Fatal error: ${error.message}`, 'red', true);
});
