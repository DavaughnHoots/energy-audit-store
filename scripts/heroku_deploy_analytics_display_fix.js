// scripts/heroku_deploy_analytics_display_fix.js
// Deploy the fix for page names and feature names in admin dashboard

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
    throw error;
  }
}

// Main function
async function deployAnalyticsDisplayFix() {
  try {
    console.log('Starting analytics dashboard display fix deployment to Heroku...');

    // Create backup of original files
    console.log('Creating backup of original files...');
    
    const filesToBackup = [
      'backend/src/services/AnalyticsService.enhanced.ts',
      'backend/src/routes/admin.enhanced.ts'
    ];
    
    filesToBackup.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.copyFileSync(
          fullPath,
          path.join(process.cwd(), `${filePath}.backup`)
        );
      }
    });
    
    // Replace AnalyticsService.enhanced.ts with our display-fix version
    console.log('Copying fixed AnalyticsService to enhanced version...');
    
    fs.copyFileSync(
      path.join(process.cwd(), 'backend/src/services/AnalyticsService.display-fix.ts'),
      path.join(process.cwd(), 'backend/src/services/AnalyticsService.enhanced.ts')
    );
    
    // Compile TypeScript files
    console.log('Compiling TypeScript files...');
    
    process.chdir('backend');
    executeCommand('npm run build');
    process.chdir('..');
    
    // Add the files to git
    console.log('Adding files to git...');
    executeCommand('git add backend/src/services/AnalyticsService.enhanced.ts backend/build/services/AnalyticsService.enhanced.js');
    
    // Commit changes
    console.log('Committing changes...');
    executeCommand('git commit -m "Fix page and feature name display in admin dashboard"');
    
    // Push to Heroku
    console.log('Deploying to Heroku...');
    executeCommand('git push heroku HEAD:main');
    
    console.log('Analytics dashboard display fix successfully deployed to Heroku!');
    console.log('Key improvements:');
    console.log('1. Page names now properly displayed in "Most Visited Pages" section');
    console.log('2. Feature names now properly displayed in "Most Used Features" section');
    console.log('3. Added better fallback for unknown names');
    console.log('4. Improved data extraction from analytics events');
    
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    
    // If we have backups, restore them
    console.log('Attempting to restore from backup...');
    
    const filesToRestore = [
      'backend/src/services/AnalyticsService.enhanced.ts'
    ];
    
    filesToRestore.forEach(filePath => {
      const backupPath = path.join(process.cwd(), `${filePath}.backup`);
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(
          backupPath,
          path.join(process.cwd(), filePath)
        );
        console.log(`Restored ${filePath} from backup`);
      }
    });
    
    process.exit(1);
  }
}

// Run the deployment
deployAnalyticsDisplayFix();
