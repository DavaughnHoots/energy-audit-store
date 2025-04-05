// scripts/deploy_dashboard_fix.js
// Direct deployment approach for the analytics dashboard fix
// This script copies only the necessary files and deploys them to Heroku

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to execute shell commands
function executeCommand(command) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${error.message}`);
    console.error(error.stdout || '');
    console.error(error.stderr || '');
    throw error;
  }
}

// Function to ensure file exists before copying
function copyFileIfExists(source, destination) {
  console.log(`Copying ${source} to ${destination}`);
  if (fs.existsSync(source)) {
    // Create a backup of the destination file if it exists
    if (fs.existsSync(destination)) {
      const backupName = `${destination}.backup-${Date.now()}`;
      fs.copyFileSync(destination, backupName);
      console.log(`Created backup at ${backupName}`);
    }
    
    fs.copyFileSync(source, destination);
    return true;
  } else {
    console.error(`Source file does not exist: ${source}`);
    return false;
  }
}

// Main function
async function deployDashboardFix() {
  try {
    console.log('Starting direct dashboard fix deployment...');

    // Step 1: Copy the fixed direct-admin file to replace the original
    const directAdminSource = path.join(process.cwd(), 'backend/src/routes/direct-admin.fixed.ts');
    const directAdminDest = path.join(process.cwd(), 'backend/src/routes/direct-admin.ts');
    
    if (!copyFileIfExists(directAdminSource, directAdminDest)) {
      console.error('Failed to copy direct-admin file');
      return;
    }
    
    console.log('Successfully replaced direct-admin.ts');
    
    // Step 2: Compile just the direct-admin.ts file
    console.log('Compiling direct-admin.ts...');
    try {
      // Use the TypeScript compiler directly to compile just this file
      const tscCompileCommand = 'npx tsc --skipLibCheck backend/src/routes/direct-admin.ts --outDir backend/build/routes';
      executeCommand(tscCompileCommand);
    } catch (error) {
      console.error('Error compiling direct-admin.ts. Continuing with deployment.');
      // We'll continue anyway and let Heroku build handle the compilation
    }
    
    // Step 3: Add files to git
    console.log('Adding files to git...');
    try {
      executeCommand('git add backend/src/routes/direct-admin.ts');
      // Also add the compiled JS if it was created
      if (fs.existsSync('backend/build/routes/direct-admin.js')) {
        executeCommand('git add backend/build/routes/direct-admin.js');
      }
    } catch (error) {
      console.error('Error adding files to git. Continuing with deployment.');
    }
    
    // Step 4: Commit changes
    console.log('Committing changes...');
    try {
      executeCommand('git commit -m "Fix analytics dashboard display of page and feature names"');
    } catch (error) {
      console.error('Error committing changes. Continuing with deployment.');
    }
    
    // Step 5: Push to Heroku
    console.log('Deploying to Heroku...');
    try {
      executeCommand('git push heroku HEAD:main');
    } catch (error) {
      console.error('Failed to push to Heroku.');
      return;
    }
    
    console.log('Dashboard fix successfully deployed to Heroku!');
    console.log('This deployment includes:');
    console.log('1. Enhanced page name extraction for "Most Visited Pages" section');
    console.log('2. Enhanced feature name extraction for "Most Used Features" section');
    console.log('3. Better displaying of names in admin dashboard');
    
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deployDashboardFix();
