/**
 * This script deploys fixes for the admin navigation analytics and auth token handling
 * in a safer way that avoids potential Unicode issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Update the build trigger file to force Heroku to rebuild
const updateBuildTrigger = () => {
  const triggerPath = path.join(process.cwd(), '.build-trigger');
  fs.writeFileSync(triggerPath, new Date().toISOString());
  console.log('Updated build trigger file');
};

// Run a shell command
const runCommand = (command) => {
  try {
    console.log(`Running command: ${command}`);
    const output = execSync(command, { encoding: 'utf-8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout || error.message);
    throw error;
  }
};

// Main deployment function
const deploy = async () => {
  try {
    console.log('Deploying admin navigation analytics and auth fixes to Heroku...');
    
    // 1. Directly run the fixed auth token script
    console.log('Running auth token fixes...');
    runCommand('node scripts/fix_auth_token_handling.js');
    
    // 2. Update build trigger
    updateBuildTrigger();
    
    // 3. Add files to git
    console.log('Adding files to git...');
    runCommand('git add .');
    
    // 4. Commit changes
    console.log('Committing changes...');
    runCommand('git commit -m "Fix admin navigation analytics and auth token handling"');
    
    // 5. Push to Heroku
    console.log('Pushing to Heroku...');
    runCommand('git push heroku main');
    
    console.log('\nAdmin navigation analytics and auth fix deployment completed successfully!');
    console.log('You can now access the admin dashboard at: https://energy-audit-store-e66479ed4f2b.herokuapp.com/admin/dashboard');
    console.log('The Most Used Features and Most Visited Pages sections should now work properly.');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
};

// Execute the deployment
deploy();
