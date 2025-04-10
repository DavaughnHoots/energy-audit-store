/**
 * Badge Cache Refresh Fix Deployment Script
 * 
 * This script deploys fixes for badge caching issues:
 * 1. Enhanced frontend cache refresh script
 * 2. New backend API endpoint for badge cache refresh
 * 3. Backend service improvements for direct badge access
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Paths
const deploymentDocsPath = path.join(
  'energy-audit-vault',
  'operations',
  'deployment',
  'badge-cache-refresh-fix-deployment.md'
);

// Banner
console.log(`
${colors.cyan}${colors.bright}========================================
   BADGE CACHE REFRESH FIX DEPLOYMENT
========================================${colors.reset}

${colors.yellow}This script will deploy the following changes:
1. Enhanced frontend badge cache refresh script
2. New backend API endpoint for badge refresh
3. Backend service improvements for direct badge access${colors.reset}
`);

// Create documentation
function createDeploymentDocs() {
  console.log(`${colors.cyan}Creating deployment documentation...${colors.reset}`);
  
  const content = `---
title: "Badge Cache Refresh Fix Deployment"
type: "Deployment"
description: "Deploy fixes for badge cache refresh issues"
status: "completed"
date: "${new Date().toISOString().split('T')[0]}"
---

# Badge Cache Refresh Fix Deployment

## Overview
This deployment addresses issues with badge display after direct database updates. When badges were added or modified directly in the database, the frontend cache prevented users from seeing these changes until the cache expired or was manually refreshed.

## Changes Deployed

### 1. Enhanced Frontend Badge Refresh Script
- Improved the \`refresh_badge_cache.js\` script with:
  - More robust error handling
  - Multiple approaches to finding and exposing the badge service
  - User-friendly notifications about cache refresh status
  - Protection against refresh loops
  - Cache-busting headers for API requests

### 2. New Backend API Endpoint
- Added \`POST /users/:userId/badges/refresh\` endpoint
- This endpoint:
  - Forces re-evaluation of all badges for a user
  - Clears any cached badge data in the service
  - Returns updated badge data

### 3. Backend Service Improvements
- Added proper method for clearing the badge service cache
- Added methods for direct badge assignment and verification

## Testing Instructions
After deployment, verify the fix works by:

1. Adding a badge directly in the database
2. Accessing the application with the refresh parameter: \`?refresh_badges=true\`
3. Verifying that the new badge appears in the user's badge collection

## Rollback Plan
If issues occur:
1. Revert to the previous commit
2. Push revert to Heroku using: \`git push -f heroku HEAD~1:main\`

## Related Documentation
- [Badge Cache Fix](../bug-fixes/badge-cache-fix.md)
- [Audit Badges Missing Fix](../bug-fixes/audit-badges-missing-fix-plan.md)
`;

  // Create directory if it doesn't exist
  const dirPath = path.dirname(deploymentDocsPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  fs.writeFileSync(deploymentDocsPath, content);
  console.log(`${colors.green}✓ Documentation created at ${deploymentDocsPath}${colors.reset}`);
}

// Deploy the changes
function deployChanges() {
  try {
    console.log(`\n${colors.cyan}Deploying changes...${colors.reset}`);
    
    // 1. Create deployment documentation
    createDeploymentDocs();
    
    // 2. Add all changes
    console.log(`\n${colors.cyan}Adding files to commit...${colors.reset}`);
    execSync('git add backend/src/routes/badges.ts backend/src/services/BadgeService.ts public/refresh_badge_cache.js energy-audit-vault/operations/deployment/badge-cache-refresh-fix-deployment.md', { stdio: 'inherit' });
    
    // 3. Commit changes
    console.log(`\n${colors.cyan}Committing changes...${colors.reset}`);
    execSync('git commit -m "Fix badge cache refresh issues with enhanced frontend script and new backend endpoint"', { stdio: 'inherit' });
    
    // 4. Push to current branch
    console.log(`\n${colors.cyan}Pushing to GitHub...${colors.reset}`);
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
    
    // 5. Deploy to Heroku
    console.log(`\n${colors.cyan}Deploying to Heroku...${colors.reset}`);
    execSync('git push heroku main', { stdio: 'inherit' });
    
    console.log(`\n${colors.green}${colors.bright}✓ Successfully deployed badge cache refresh fix to Heroku!${colors.reset}`);
    console.log(`${colors.green}Users can now refresh their badge data by visiting the app with '?refresh_badges=true'${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}Error during deployment:${colors.reset}`, error.message);
    console.log(`\n${colors.yellow}You may need to deploy manually:${colors.reset}`);
    console.log('  git add backend/src/routes/badges.ts backend/src/services/BadgeService.ts public/refresh_badge_cache.js');
    console.log('  git add energy-audit-vault/operations/deployment/badge-cache-refresh-fix-deployment.md');
    console.log('  git commit -m "Fix badge cache refresh issues"');
    console.log('  git push origin [your-branch]');
    console.log('  git push heroku main');
    return false;
  }
}

// Main function
function main() {
  deployChanges();
}

// Run the script
main();
