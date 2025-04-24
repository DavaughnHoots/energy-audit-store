/**
 * Fix for token naming mismatch in userAuthService.ts
 * 
 * Problem: The loginUser method returns 'token' but routes expect 'accessToken'
 * Solution: Update loginUser method to return 'accessToken' instead of 'token'
 */

const fs = require('fs');
const path = require('path');

// File path
const userAuthServicePath = path.join(
  process.cwd(),
  'backend/src/services/userAuthService.ts'
);

// Create backup
const backupPath = `${userAuthServicePath}.token-fix-backup-${Date.now()}`;
fs.copyFileSync(userAuthServicePath, backupPath);
console.log(`✅ Created backup at ${backupPath}`);

// Read the file
let content = fs.readFileSync(userAuthServicePath, 'utf8');

// Replace the return statement in loginUser method
// This is a precise replacement to change 'token' to 'accessToken' in the return object
content = content.replace(
  /return \{\s*user: \{\s*id: user\.id,\s*email: user\.email,\s*fullName: user\.full_name,\s*role: user\.role\s*\},\s*token,\s*refreshToken\s*\};/g,
  `return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role
      },
      accessToken: token,  // Changed 'token' to 'accessToken' for consistency
      refreshToken
    };`
);

// Save the modified file
fs.writeFileSync(userAuthServicePath, content);
console.log(`✅ Updated userAuthService.ts with consistent token naming`);

// Also update auth.ts to log token information
const authRoutesPath = path.join(process.cwd(), 'backend/src/routes/auth.ts');
const authBackupPath = `${authRoutesPath}.token-fix-backup-${Date.now()}`;
fs.copyFileSync(authRoutesPath, authBackupPath);
console.log(`✅ Created auth routes backup at ${authBackupPath}`);

let authContent = fs.readFileSync(authRoutesPath, 'utf8');

// Add logging after the login result is obtained
authorContent = authContent.replace(
  /const result = await authService\.loginUser\(email, password\);/g,
  `const result = await authService.loginUser(email, password);

      // Debug log token values
      console.log('Login response token structure:', { 
        hasAccessToken: Boolean(result.accessToken),
        token: typeof result.token !== 'undefined' ? 'defined' : 'undefined',
        refreshToken: Boolean(result.refreshToken)
      });

      // Safety check for accessToken
      if (!result.accessToken) {
        console.error('ERROR: userAuthService.loginUser did not return a valid accessToken');
        return res.status(500).json({ error: 'Authentication error: Invalid token generation' });
      }`
);

// Save the modified auth file
fs.writeFileSync(authRoutesPath, authContent);
console.log(`✅ Updated auth.ts with additional safety checks`);

console.log('✅ Fix completed. Deploy this change to fix the token naming mismatch.');
