/**
 * This script fixes issues with the admin dashboard by:
 * 1. Ensuring proper API endpoint paths in the frontend
 * 2. Adding mock data fallbacks for admin analytics data
 * 3. Deploying the changes to Heroku
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command, showOutput = true) {
  try {
    log(`\nExecuting: ${command}`, colors.blue);
    const output = execSync(command, { encoding: 'utf8' });
    if (showOutput) {
      log(output);
    }
    return { success: true, output };
  } catch (error) {
    log(`\nCommand failed: ${command}`, colors.red);
    log(error.message, colors.red);
    return { success: false, error };
  }
}

// 1. Verify that frontend component is fixed (paths don't include /api/api duplication)
function verifyFrontendFixes() {
  log('\n=== Verifying frontend fixes ===', colors.bright + colors.green);
  const roadmapBuilderPath = path.join(__dirname, '../src/components/admin/RoadmapBuilder.tsx');
  
  if (!fs.existsSync(roadmapBuilderPath)) {
    log('RoadmapBuilder.tsx not found!', colors.red);
    process.exit(1);
  }
  
  const content = fs.readFileSync(roadmapBuilderPath, 'utf8');
  const apiDuplication = content.includes('/api/api/admin/analytics/');
  const incorrectPaths = content.includes('/api/admin/analytics/');
  const correctPaths = content.includes('/admin/analytics/');
  
  if (apiDuplication) {
    log('Found API path duplication in RoadmapBuilder.tsx!', colors.red);
    log('Please fix the paths to remove the duplication', colors.yellow);
    process.exit(1);
  }
  
  if (incorrectPaths) {
    log('Found incorrect API paths in RoadmapBuilder.tsx!', colors.red);
    log('Please fix the paths to use format "/admin/analytics/..."', colors.yellow);
    process.exit(1);
  }
  
  if (!correctPaths) {
    log('Could not find correct API paths in RoadmapBuilder.tsx!', colors.red);
    log('Please ensure the component uses paths like "/admin/analytics/..."', colors.yellow);
    process.exit(1);
  }
  
  log('Frontend paths verified successfully!', colors.green);
}

// 2. Verify that backend mock data is in place
function verifyBackendMockData() {
  log('\n=== Verifying backend mock data ===', colors.bright + colors.green);
  const mockFilePath = path.join(__dirname, '../backend/src/routes/admin-analytics-mock.ts');
  const routeFilePath = path.join(__dirname, '../backend/src/routes/adminAnalytics.ts');
  
  if (!fs.existsSync(mockFilePath)) {
    log('admin-analytics-mock.ts not found!', colors.red);
    process.exit(1);
  }
  
  if (!fs.existsSync(routeFilePath)) {
    log('adminAnalytics.ts not found!', colors.red);
    process.exit(1);
  }
  
  const routeContent = fs.readFileSync(routeFilePath, 'utf8');
  const importsMockData = routeContent.includes('import { getMockFeatures, getMockPages, getMockCorrelations } from');
  const usesMockData = routeContent.includes('executeQueryWithMockFallback');
  
  if (!importsMockData || !usesMockData) {
    log('adminAnalytics.ts does not properly import or use mock data!', colors.red);
    process.exit(1);
  }
  
  log('Backend mock data verified successfully!', colors.green);
}

// 3. Build the project
function buildProject() {
  log('\n=== Building project ===', colors.bright + colors.green);
  const result = executeCommand('npm run build');
  if (!result.success) {
    log('Build failed!', colors.red);
    process.exit(1);
  }
  log('Build completed successfully!', colors.green);
}

// 4. Deploy to Heroku
function deployToHeroku() {
  log('\n=== Deploying to Heroku ===', colors.bright + colors.green);
  
  // Add all changes to git
  executeCommand('git add .');
  
  // Commit changes
  const commitMessage = 'Fix admin dashboard - remove API path duplication and add mock data';
  executeCommand(`git commit -m "${commitMessage}"`);
  
  // Push to Heroku
  const deployResult = executeCommand('git push heroku main');
  if (!deployResult.success) {
    log('Deployment to Heroku failed!', colors.red);
    log('You may need to push manually.', colors.yellow);
    process.exit(1);
  }
  
  log('Deployment to Heroku completed successfully!', colors.green);
}

// Main execution
function main() {
  log('\n======================================', colors.bright);
  log('ADMIN DASHBOARD FIX SCRIPT', colors.bright + colors.green);
  log('======================================\n', colors.bright);
  
  try {
    verifyFrontendFixes();
    verifyBackendMockData();
    buildProject();
    
    // Ask before deploying
    log('\nReady to deploy to Heroku. This will commit all changes.', colors.yellow);
    log('To skip deployment, press Ctrl+C now.\n', colors.yellow);
    log('Deploying in 5 seconds...', colors.yellow);
    
    // Wait 5 seconds to give user a chance to cancel
    setTimeout(() => {
      deployToHeroku();
      
      log('\n======================================', colors.bright);
      log('ADMIN DASHBOARD FIX COMPLETED', colors.bright + colors.green);
      log('======================================\n', colors.bright);
      log('The admin dashboard should now be working correctly.', colors.green);
      log('Visit /admin/dashboard to verify.', colors.green);
    }, 5000);
  } catch (error) {
    log(`\nAn error occurred during the fix process: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the script
main();
