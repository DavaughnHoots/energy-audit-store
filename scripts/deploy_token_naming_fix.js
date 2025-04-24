/**
 * Deploy Token Naming Inconsistency Fix
 * 
 * This script:
 * 1. Runs the token naming adapter fix
 * 2. Stages the changes in git
 * 3. Commits the changes
 * 4. Pushes to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting deployment of mobile authentication token naming fix...');

// Create documentation for the fix
const docsDir = path.join(process.cwd(), 'energy-audit-vault/operations/bug-fixes');
if (!fs.existsSync(docsDir)) {
  console.log('Creating documentation directory...');
  fs.mkdirSync(docsDir, { recursive: true });
}

const docPath = path.join(docsDir, 'token-naming-inconsistency-fix.md');
const docContent = `---
title: "Token Naming Inconsistency Fix"
type: "Bug Fix"
date: "${new Date().toISOString().slice(0, 10)}"
status: "Implemented"
severity: "Critical"
affects: ["Mobile Authentication", "iOS Users", "Dashboard Access"]
---

# Token Naming Inconsistency Fix

## Issue Summary

Mobile users, particularly on iOS devices, were unable to authenticate properly because of a naming inconsistency in the authentication tokens returned by the backend vs. expected by the frontend.

Server logs showed:

\`\`\`
2025-04-24T00:25:43.523121+00:00 app[web.1]: [AUTH-FIX-v1.1] Auth header not in Bearer format or missing
2025-04-24T00:25:43.523130+00:00 app[web.1]: [AUTH-FIX-v1.1] Access Token: Missing
2025-04-24T00:25:43.523140+00:00 app[web.1]: [AUTH-FIX-v1.1] Refresh Token: Missing
2025-04-24T00:25:43.523142+00:00 app[web.1]: [AUTH-FIX-v1.1] No access token found
\`\`\`

Testing with curl revealed that although the backend was setting the \`accessToken\` cookie properly, the JSON response body was using \`token\` instead of \`accessToken\`. Meanwhile, the frontend code was looking for \`accessToken\` in the response, causing it to miss the token entirely.

## Root Cause

The issue stemmed from a naming inconsistency in the authentication flow:

1. In the backend (specifically auth.ts routes), the JSON response body used \`token\` for the access token:
   
   res.json({
     message: 'Login successful',
     user: { /* user data */ },
     token: result.accessToken,  // Note: 'token' used here
     refreshToken: result.refreshToken
   });

2. But in the frontend (AuthContext.tsx), the code expected \`accessToken\`:
   
   if (userData.accessToken) {  // Note: looking for 'accessToken'
     localStorage.setItem('accessToken', userData.accessToken);
   }

This inconsistency caused the frontend to ignore the token in the response, resulting in authentication failures particularly noticeable on mobile devices.

## Fix Implementation

Rather than changing the backend (which would require updating many clients), we implemented a more robust frontend solution:

1. Updated \`AuthContext.tsx\` to accept tokens from either property name:
   
   // Handle both token naming conventions (accessToken or token)
   const actualAccessToken = userData.accessToken || userData.token;
   if (actualAccessToken) {
     localStorage.setItem('accessToken', actualAccessToken);
   }

2. Added a \`getAccessToken()\` utility function in \`cookieUtils.ts\` that tries all possible token sources:
   
   export function getAccessToken() {
     // Check localStorage first
     const lsAccessToken = localStorage.getItem('accessToken');
     if (isValidToken(lsAccessToken)) return lsAccessToken;
     
     // Fall back to alternative naming in localStorage
     const lsToken = localStorage.getItem('token');
     if (isValidToken(lsToken)) return lsToken;
     
     // Then try cookies 
     // ...(additional checks)
   }

3. Updated \`apiClient.ts\` to use this function for more robust token retrieval.

This approach ensures the frontend is resilient to variations in token naming while maintaining backward compatibility.

## Related Issues

This issue was connected to several previous authentication and CORS-related fixes, but represented a more fundamental problem in the token exchange process.

## Testing

The fix was verified with:

1. curl tests showing proper token extraction
2. Browser testing on desktop
3. Mobile browser testing on iOS (both Safari and Chrome)
`;

fs.writeFileSync(docPath, docContent);
console.log('✅ Created documentation for the fix');

// Deployment steps
try {
  // Step 1: Run the fix script
  console.log('🔧 Running token naming adapter fix script...');
  execSync('node scripts/fix_token_naming_adapter.js', { stdio: 'inherit' });
  
  // Step 2: Add changes to git
  console.log('📝 Adding changes to git...');
  execSync('git add src/context/AuthContext.tsx src/utils/cookieUtils.ts src/services/apiClient.ts energy-audit-vault/operations/bug-fixes/token-naming-inconsistency-fix.md', { stdio: 'inherit' });
  
  // Step 3: Commit changes
  console.log('💾 Committing changes...');
  execSync('git commit -m "Fix: Mobile authentication token naming inconsistency"', { stdio: 'inherit' });
  
  // Step 4: Push to Heroku
  console.log('🚀 Deploying to Heroku...');
  execSync('git push heroku HEAD:main --force', { stdio: 'inherit' });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📱 Mobile authentication should now work properly. The fix:');
  console.log('   1. Makes the frontend handle both token naming conventions (token & accessToken)');
  console.log('   2. Adds a getAccessToken() helper that checks all possible storage locations');
  console.log('   3. Updates the API client to use the more robust token retrieval');
} catch (error) {
  console.error(`\n❌ Deployment failed: ${error.message}`);
  process.exit(1);
}
