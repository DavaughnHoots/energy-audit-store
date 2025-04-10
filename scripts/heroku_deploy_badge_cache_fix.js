const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Simple color functions
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

// Helper function to combine styling
const colorize = {
  green: {
    bold: (text) => colors.green(colors.bold(text))
  },
  yellow: {
    bold: (text) => colors.yellow(colors.bold(text))
  },
  red: {
    bold: (text) => colors.red(colors.bold(text))
  },
  cyan: {
    bold: (text) => colors.cyan(colors.bold(text))
  }
};

console.log(colorize.cyan.bold('=== Badge Cache Refresh Deployment ==='));
console.log(colors.yellow('This script ensures the frontend properly refreshes badge data after database updates'));

// 1. Check if badge service has proper cache invalidation methods
const verifyBadgeService = () => {
  console.log('Verifying badge service implementation...');
  
  const badgeServicePath = path.resolve('src/services/badgeService.ts');
  if (!fs.existsSync(badgeServicePath)) {
    console.error(colors.red('Could not find badge service. Please check your project structure.'));
    return false;
  }
  
  try {
    const content = fs.readFileSync(badgeServicePath, 'utf8');
    
    // Check for invalidation methods
    const hasInvalidateMethod = content.includes('invalidateCache') || 
                              content.includes('invalidateUserCache');
    
    if (!hasInvalidateMethod) {
      console.error(colors.red('Badge service does not have proper cache invalidation methods.'));
      return false;
    }
    
    console.log(colors.green('✓ Badge service verified successfully'));
    return true;
  } catch (error) {
    console.error(colors.red('Error verifying badge service:'), error);
    return false;
  }
};

// 2. Add the refresh badge cache script
const addRefreshCacheScript = () => {
  console.log('Adding badge cache refresh script...');
  
  const cacheScriptPath = path.resolve('scripts/refresh_badge_cache.js');
  const publicPath = path.resolve('public');
  const destPath = path.join(publicPath, 'refresh_badge_cache.js');
  
  try {
    // Make sure public directory exists
    if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
    }
    
    // Copy from scripts to public
    fs.copyFileSync(cacheScriptPath, destPath);
    
    console.log(colors.green(`✓ Badge cache refresh script copied to ${destPath}`));
    return true;
  } catch (error) {
    console.error(colors.red('Error adding refresh cache script:'), error);
    return false;
  }
};

// 3. Add cache refresh trigger to index page
const updateIndexHtml = () => {
  console.log('Updating index.html to include cache refresh script...');
  
  const indexPath = path.resolve('index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(colors.red('Could not find index.html. Please check your project structure.'));
    return false;
  }
  
  try {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Check if script is already included
    if (content.includes('refresh_badge_cache.js')) {
      console.log(colors.yellow('Cache refresh script already included in index.html. Skipping update.'));
      return true;
    }
    
    // Find where to insert the script
    const headEndMatch = content.match(/<\/head>/i);
    if (!headEndMatch) {
      console.error(colors.red('Could not find </head> tag in index.html'));
      return false;
    }
    
    // Insert script reference before </head>
    const scriptTag = `
  <!-- Badge cache refresh script (temporary, remove after fixing cache issues) -->
  <script>
    // Only run the refresh script if URL has refresh_badges=true parameter
    if (window.location.search.includes('refresh_badges=true')) {
      const script = document.createElement('script');
      script.src = '/refresh_badge_cache.js';
      script.async = true;
      document.head.appendChild(script);
    }
  </script>
`;
    
    const insertPosition = headEndMatch.index;
    content = content.slice(0, insertPosition) + scriptTag + content.slice(insertPosition);
    
    fs.writeFileSync(indexPath, content);
    console.log(colors.green('✓ Successfully updated index.html with cache refresh script'));
    return true;
  } catch (error) {
    console.error(colors.red('Error updating index.html:'), error);
    return false;
  }
};

// 4. Create documentation
const createDocumentation = () => {
  console.log('Creating documentation for badge cache fix...');
  
  const docsPath = path.resolve('energy-audit-vault/operations/bug-fixes/badge-cache-fix.md');
  
  try {
    const documentation = `---
title: "Badge Cache Fix"
type: "Bug Fix"
description: "Fix to refresh badge cache after direct database updates"
status: "implemented"
last_verified: "${new Date().toISOString().split('T')[0]}"
---

# Badge Cache Fix

## Issue Description

After making direct database updates to add audit badges, the frontend wasn't properly displaying the updated badge status. This was due to the frontend caching badge data, which didn't reflect the database changes.

## Root Cause

- Badge data is cached in multiple places:
  - The \`badgeService\` has an in-memory cache with a 5-minute expiration
  - \`localStorage\` is used as a fallback for badge checking timestamps
  - API responses may be cached by the browser

When manual database updates are made to award badges, these cache layers prevent the frontend from seeing the changes until the cache expires or is manually invalidated.

## Fix Implementation

1. Created a cache-busting script (\`refresh_badge_cache.js\`) that:
   - Clears all badge-related data from localStorage
   - Exposes the badgeService to the window object
   - Calls invalidateCache() on the badgeService

2. Added the script to the public directory and referenced it conditionally in index.html
   - Only loads when the URL has \`?refresh_badges=true\` parameter
   - Prevents unnecessary cache clearing during normal use

## How to Use

After making direct database changes to badges:

1. Access the application with the parameter: \`https://energy-audit-store-e66479ed4f2b.herokuapp.com/?refresh_badges=true\`
2. The script will automatically run, clearing all badge caches
3. After the page loads, refresh the page once more (without the parameter)
4. Badge status should now correctly reflect the database state

## Future Improvements

- Add a manual "Refresh Badges" button in the admin interface
- Implement webhook triggers when badges are awarded via database updates
- Improve the caching strategy to use ETags or versioned cache keys
`;
    
    // Make sure directory exists
    const dirPath = path.dirname(docsPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(docsPath, documentation);
    console.log(colors.green(`✓ Documentation created at ${docsPath}`));
    return true;
  } catch (error) {
    console.error(colors.red('Error creating documentation:'), error);
    return false;
  }
};

// 5. Commit changes and deploy
const deployChanges = () => {
  console.log('Committing and deploying changes...');
  
  try {
    // Add all changes
    execSync('git add .', { stdio: 'inherit' });
    
    // Commit with descriptive message
    execSync('git commit -m "Fix badge caching issues after database updates"', { stdio: 'inherit' });
    
    // Push to current branch
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
    
    // Deploy to Heroku
    execSync('git push heroku main', { stdio: 'inherit' });
    
    console.log(colors.green('✓ Successfully deployed badge cache fix to Heroku'));
    return true;
  } catch (error) {
    console.error(colors.red('Error deploying changes:'), error);
    console.log(colors.yellow('You may need to deploy manually:'));
    console.log('  git add .');
    console.log('  git commit -m "Fix badge caching issues after database updates"');
    console.log('  git push origin [your-branch]');
    console.log('  git push heroku main');
    return false;
  }
};

// Main function to coordinate all the steps
const main = async () => {
  console.log(colors.cyan('Starting badge cache fix deployment...'));
  
  // Step 1: Verify badge service
  const serviceVerified = verifyBadgeService();
  
  // Step 2: Add refresh cache script to public directory
  const scriptAdded = addRefreshCacheScript();
  
  // Step 3: Update index.html
  const indexUpdated = updateIndexHtml();
  
  // Step 4: Create documentation
  const docsCreated = createDocumentation();
  
  // Check if all steps succeeded
  const allSuccessful = serviceVerified && scriptAdded && indexUpdated && docsCreated;
  
  console.log('\n' + colorize.cyan.bold('Deployment Results:'));
  console.log(colors.cyan('- Badge Service Verification: ') + (serviceVerified ? colors.green('✓ Success') : colors.red('✗ Failed')));
  console.log(colors.cyan('- Cache Script Added: ') + (scriptAdded ? colors.green('✓ Success') : colors.red('✗ Failed')));
  console.log(colors.cyan('- Index HTML Updated: ') + (indexUpdated ? colors.green('✓ Success') : colors.red('✗ Failed')));
  console.log(colors.cyan('- Documentation Created: ') + (docsCreated ? colors.green('✓ Success') : colors.red('✗ Failed')));
  
  if (allSuccessful) {
    console.log('\n' + colorize.green.bold('All preparation steps completed successfully!'));
    
    // Ask to deploy
    console.log(colors.yellow('Do you want to automatically commit and deploy to Heroku? (y/n)'));
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      if (answer === 'y' || answer === 'yes') {
        deployChanges();
      } else {
        console.log(colors.yellow('Manual deployment required. Follow these steps:'));
        console.log('  git add .');
        console.log('  git commit -m "Fix badge caching issues after database updates"');
        console.log('  git push origin [your-branch]');
        console.log('  git push heroku main');
      }
    });
  } else {
    console.log('\n' + colorize.red.bold('Some steps failed. Please fix the issues before deploying.'));
  }
};

// Run the main function
main();
