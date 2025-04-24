/**
 * Mobile Authentication Fix and Deploy
 * 
 * This script deploys the combined iOS Safari/Chrome authentication fixes:
 * 1. Enhanced cookie settings for iOS
 * 2. Improved token storage with localStorage fallback
 * 3. Better Authorization header handling
 * 4. Fixed User type definition
 */

const { execSync } = require('child_process');

function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    console.error(`Error executing ${command}:`, error.message);
    return { success: false, error: error.message };
  }
}

function main() {
  console.log('🚀 Starting deployment of iOS/mobile authentication fixes...');

  // Stage the modified files
  console.log('Staging modified files...');
  const filesToStage = [
    'src/utils/cookieUtils.ts',
    'src/context/AuthContext.tsx',
    'src/types/auth.ts',
    'src/services/apiClient.ts'
  ];
  
  executeCommand(`git add ${filesToStage.join(' ')}`);
  
  // Create commit
  const commitResult = executeCommand(`git commit -m "Fix iOS & mobile authentication issues with SameSite=None; Secure and localStorage fallback"`);
  if (!commitResult.success) {
    console.error('❌ Failed to create commit. Aborting deployment.');
    return;
  }
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  const pushResult = executeCommand('git push origin fix/user-dashboard');
  if (!pushResult.success) {
    console.error('❌ Failed to push to GitHub. Aborting Heroku deployment.');
    return;
  }
  
  // Deploy to Heroku
  console.log('Deploying to Heroku...');
  const herokuResult = executeCommand('git push heroku fix/user-dashboard:main');
  
  if (herokuResult.success) {
    console.log('✅ Successfully deployed mobile authentication fixes to Heroku!');
    
    // Check logs
    console.log('📊 Fetching Heroku logs to verify deployment...');
    executeCommand('heroku logs --tail --app energy-audit-store');
  } else {
    console.error('❌ Failed to deploy to Heroku. Check the error message above.');
  }
}

// Execute main script
main();
