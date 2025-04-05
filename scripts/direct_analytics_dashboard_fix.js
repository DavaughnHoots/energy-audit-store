// scripts/direct_analytics_dashboard_fix.js
// A more direct approach to fix the analytics dashboard issues

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
    console.error(error.stdout);
    console.error(error.stderr);
    throw error;
  }
}

// Function to ensure file exists before copying
function copyFileIfExists(source, destination) {
  console.log(`Copying ${source} to ${destination}`);
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, destination);
    return true;
  } else {
    console.error(`Source file does not exist: ${source}`);
    return false;
  }
}

// Main function
async function deployAnalyticsFix() {
  try {
    console.log('Starting direct analytics dashboard fix...');

    // Step 1: Make sure we have the necessary dependencies
    console.log('Installing required dependencies...');
    executeCommand('cd backend && npm install --save-dev @types/node');
    
    // Step 2: Backup original files
    console.log('Creating backup of original files...');
    const filesToBackup = [
      'backend/src/services/AnalyticsService.ts',
      'backend/src/routes/admin.ts',
      'backend/src/server.ts'
    ];
    
    filesToBackup.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      const backupPath = `${fullPath}.backup-${Date.now()}`;
      if (fs.existsSync(fullPath)) {
        fs.copyFileSync(fullPath, backupPath);
      }
    });
    
    // Step 3: Copy our enhanced AnalyticsService implementation directly to the main file
    console.log('Applying AnalyticsService fix directly...');
    const analyticsServiceSource = path.join(process.cwd(), 'backend/src/services/AnalyticsService.display-fix.ts');
    const analyticsServiceDest = path.join(process.cwd(), 'backend/src/services/AnalyticsService.ts');
    
    if (copyFileIfExists(analyticsServiceSource, analyticsServiceDest)) {
      console.log('Successfully applied AnalyticsService fix');
    } else {
      console.error('Failed to apply AnalyticsService fix');
      return;
    }
    
    // Step 4: Copy the enhanced server file
    console.log('Applying server enhancements...');
    const serverSource = path.join(process.cwd(), 'backend/src/server.enhanced.ts');
    const serverDest = path.join(process.cwd(), 'backend/src/server.ts');
    
    if (copyFileIfExists(serverSource, serverDest)) {
      console.log('Successfully applied server enhancements');
    } else {
      console.error('Failed to apply server enhancements');
      return;
    }
    
    // Step 5: Compile TypeScript files
    console.log('Compiling TypeScript files...');
    executeCommand('cd backend && npm run build');
    
    // Step 6: Add the modified files to git
    console.log('Adding files to git...');
    executeCommand('git add backend/src/services/AnalyticsService.ts backend/src/server.ts backend/build/');
    
    // Step 7: Commit changes
    console.log('Committing changes...');
    executeCommand('git commit -m "Direct fix for analytics dashboard display issues"');
    
    // Step 8: Push to Heroku
    console.log('Deploying to Heroku...');
    executeCommand('git push heroku HEAD:main');
    
    console.log('Analytics dashboard fix deployed successfully!');
    console.log('This deployment includes:');
    console.log('1. Fixed page names display in admin dashboard');
    console.log('2. Fixed feature names display in admin dashboard');
    console.log('3. Enhanced component tracking with proper console logging');
    console.log('4. Added debug endpoint at /api/debug/config to verify deployment');
    
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deployAnalyticsFix();
