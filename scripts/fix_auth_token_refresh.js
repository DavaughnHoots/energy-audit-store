// Script to fix auth token field naming inconsistency
// This script fixes the issue where the refreshToken method in userAuthService.ts
// returns "token" instead of "accessToken", causing refresh endpoint 500 errors

const fs = require('fs');
const path = require('path');

// Path to the userAuthService file
const userAuthServicePath = path.join(__dirname, '../backend/src/services/userAuthService.ts');

// Read the file
console.log('Reading userAuthService.ts...');
let serviceContent = fs.readFileSync(userAuthServicePath, 'utf8');

// Replace the return value in refreshToken method
console.log('Updating refreshToken method return value...');
serviceContent = serviceContent.replace(
  `return { token: newToken, refreshToken: newRefreshToken };`,
  `// Return with consistent field naming: accessToken instead of token
      // This ensures consistency with what the routes/auth.ts expects
      return { accessToken: newToken, refreshToken: newRefreshToken };`
);

// Write the updated content back to the file
console.log('Writing updated content to file...');
fs.writeFileSync(userAuthServicePath, serviceContent, 'utf8');

console.log('Successfully fixed auth token field naming inconsistency!');
