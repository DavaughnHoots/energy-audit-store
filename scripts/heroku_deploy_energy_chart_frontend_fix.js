/* 
 * Energy Chart Frontend Fix Deployment Script
 * 
 * This script deploys the updated energy chart components with:
 * 1. Enhanced energy breakdown calculations
 * 2. Fixed Y-axis label positioning
 * 3. Detailed energy category display
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting energy chart frontend fix deployment...');

// Function to safely execute commands
function runCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf-8' });
    console.log('Command completed successfully');
    return output;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    throw error;
  }
}

// Check if files exist
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Create new branch for the changes
try {
  // Check if we're already on the energy-chart-fix branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  
  if (currentBranch !== 'energy-chart-fix') {
    console.log('Creating and checking out energy-chart-fix branch...');
    
    // Check if the branch exists
    const branches = execSync('git branch', { encoding: 'utf-8' });
    
    if (branches.includes('energy-chart-fix')) {
      runCommand('git checkout energy-chart-fix');
    } else {
      runCommand('git checkout -b energy-chart-fix');
    }
  } else {
    console.log('Already on energy-chart-fix branch');
  }
} catch (error) {
  console.error('Error handling git branch:', error);
  process.exit(1);
}

// Check if our files exist before committing
const filesToCheck = [
  'src/utils/energyBreakdownCalculations.ts',
  'src/pages/NewUserDashboardPage.tsx',
  'src/components/dashboard2/ChartSection.tsx'
];

const missingFiles = [];
filesToCheck.forEach(file => {
  if (!fileExists(file)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('Error: The following files are missing:');
  missingFiles.forEach(file => console.error(`- ${file}`));
  console.error('Please make sure these files exist before running this script.');
  process.exit(1);
}

// Commit the changes to the new branch
try {
  console.log('Committing frontend chart changes...');
  runCommand('git add src/utils/energyBreakdownCalculations.ts');
  runCommand('git add src/pages/NewUserDashboardPage.tsx');
  runCommand('git add src/components/dashboard2/ChartSection.tsx');
  runCommand('git commit -m "Deploy energy chart frontend enhancements with detailed category breakdown and fixed Y-axis label"');
} catch (error) {
  console.error('Error committing changes:', error);
  process.exit(1);
}

// Push to repository
try {
  console.log('Pushing to repository...');
  runCommand('git push origin energy-chart-fix');
} catch (error) {
  console.error('Error pushing to repository:', error);
  console.log('You may need to push manually with: git push origin energy-chart-fix');
}

// Build the frontend assets
try {
  console.log('Building frontend assets...');
  runCommand('npm run build');
} catch (error) {
  console.error('Error building frontend assets:', error);
  process.exit(1);
}

// Deploy to Heroku
try {
  console.log('Deploying to Heroku...');
  runCommand('git push heroku energy-chart-fix:main --force');
} catch (error) {
  console.error('Error deploying to Heroku:', error);
  console.log('You may need to deploy manually with: git push heroku energy-chart-fix:main --force');
}

console.log('Energy chart frontend enhancements deployment completed successfully');
