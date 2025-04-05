// scripts/heroku_deploy_page_paths_fix.js
// Deploy the page paths fix to show actual page URLs instead of just area codes

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
async function deployPagePathsFix() {
  try {
    console.log('Starting page paths fix deployment to Heroku...');

    // Ensure we're on the main branch
    executeCommand('git checkout main');

    // Files we've modified
    const modifiedFiles = [
      'src/pages/AdminDashboardPage.tsx',
      'backend/src/routes/direct-admin.ts',
      'dashboard-page-paths-implementation-plan.md'
    ];

    // Create backup of the original files
    console.log('Creating backup of original files...');
    
    modifiedFiles.forEach(filePath => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.copyFileSync(
          fullPath,
          path.join(process.cwd(), `${filePath}.backup`)
        );
      }
    });
    
    // Git operations
    console.log('Adding modified files...');
    executeCommand(`git add src/pages/AdminDashboardPage.tsx backend/src/routes/direct-admin.ts`);
    
    console.log('Committing changes...');
    executeCommand('git commit -m "Fix Most Visited Pages to show actual page paths"');

    // Deploy to Heroku
    console.log('Deploying to Heroku...');
    executeCommand('git push heroku HEAD:main');

    console.log('Page paths fix successfully deployed to Heroku!');
    console.log('Key changes:');
    console.log('1. Updated SQL query to extract page paths and titles from analytics events');
    console.log('2. Enhanced the UI to display page titles and paths instead of just area codes');
    console.log('3. Added tooltips to show full path and area information on hover');
  } catch (error) {
    console.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the deployment
deployPagePathsFix();
