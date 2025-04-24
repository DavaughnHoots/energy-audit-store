/**
 * Comprehensive fix for mobile authentication issues
 * This script updates the SignIn component to properly extract tokens from the response
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exit } = require('process');

// File paths
const signInPath = path.join(process.cwd(), 'src/components/auth/SignIn.tsx');
const signInFixedPath = path.join(process.cwd(), 'src/components/auth/SignIn.fixed.tsx');

console.log('🔄 Applying token handling fix for mobile authentication...');

// Backup the original file
const backupPath = `${signInPath}.backup-${new Date().toISOString().replace(/:/g, '-')}`;
fs.copyFileSync(signInPath, backupPath);
console.log(`✅ Original file backed up to ${backupPath}`);

// Apply the fixed version
try {
  if (!fs.existsSync(signInFixedPath)) {
    console.error(`❌ Fixed file not found at ${signInFixedPath}. Aborting.`);
    exit(1);
  }
  
  fs.copyFileSync(signInFixedPath, signInPath);
  console.log('✅ Successfully updated SignIn component with token extraction fix');
  
  // Deploy the changes
  console.log('🚀 Deploying changes to Heroku...');
  
  // Add the changed file
  const addCommand = 'git add src/components/auth/SignIn.tsx';
  console.log(`Executing: ${addCommand}`);
  execSync(addCommand, { stdio: 'inherit' });
  
  // Commit the changes
  const commitCommand = 'git commit -m "Fix: Enhance token handling in SignIn component for mobile compatibility"';
  console.log(`Executing: ${commitCommand}`);
  execSync(commitCommand, { stdio: 'inherit' });
  
  // Push to Heroku
  const pushCommand = 'git push heroku HEAD:main --force';
  console.log(`Executing: ${pushCommand}`);
  execSync(pushCommand, { stdio: 'inherit' });
  
  console.log('✅ Successfully deployed the fix to Heroku!');
  console.log('📱 Mobile authentication should now work properly when tokens are present in the response.');
  console.log('⏱️ Please wait a moment for the changes to take effect.');
} catch (error) {
  console.error('❌ Error occurred:', error.message);
  console.log('⚠️ Rolling back changes...');
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, signInPath);
    console.log('✅ Changes rolled back successfully.');
  } else {
    console.error('❌ Could not rollback - backup file missing');
  }
  exit(1);
}
