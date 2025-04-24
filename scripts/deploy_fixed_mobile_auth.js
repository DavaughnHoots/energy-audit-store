/**
 * Deploy Mobile Authentication Fix with build error fix
 *
 * This script will commit the fixes to the cookie syntax error
 * and deploy to Heroku.
 */

const { execSync } = require('child_process');

function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    console.error(`Error executing ${command}:`);  
    console.error(error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Starting deployment of mobile auth fix with syntax error correction...');

  // Stage the fixed cookieUtils.ts file
  executeCommand('git add src/utils/cookieUtils.ts');
  
  // Commit the fix
  executeCommand('git commit -m "Fix syntax error in cookieUtils.ts for mobile auth"');
  
  // Push to GitHub
  console.log('Pushing changes to GitHub...');
  const githubPush = executeCommand('git push origin fix/user-dashboard');
  
  if (!githubPush.success) {
    console.error('Failed to push to GitHub! Aborting Heroku deployment.');
    return;
  }
  
  // Deploy to Heroku
  console.log('Deploying to Heroku...');
  const herokuDeploy = executeCommand('git push heroku fix/user-dashboard:main');
  
  if (herokuDeploy.success) {
    console.log('✅ Successfully deployed to Heroku!');
    console.log('🔍 Fetching Heroku logs to verify deployment...');
    executeCommand('heroku logs --tail --app energy-audit-store');
  } else {
    console.error('❌ Failed to deploy to Heroku!');
  }
}

// Execute main function
main();
