/**
 * Direct Sign-in Token Fix Deploy
 * 
 * This script directly deploys the sign-in token fix to Heroku
 * by committing the changes we've already made to auth.ts and pushing to Heroku.
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

// Deploy to Heroku
function main() {
  console.log('🔍 Deploying sign-in token fix to Heroku...');
  
  // Stage the changes
  executeCommand('git add backend/src/routes/auth.ts');
  
  // Commit the changes
  executeCommand('git commit -m "Fix: Include tokens in signin JSON response for iOS compatibility"');
  
  // Push to Heroku
  const result = executeCommand('git push heroku HEAD:main --force');
  
  if (result.success) {
    console.log('✅ Successfully deployed changes to Heroku!');
    console.log('📱 iOS authentication should now work properly.');
    console.log('⏱️ Please wait a moment for the changes to take effect, then test on your iOS device.');
  } else {
    console.error('❌ Failed to deploy to Heroku. Check the error message above.');
  }
}

// Run the script
main();
