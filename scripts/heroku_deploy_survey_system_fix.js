/**
 * Script to deploy the survey system fix to Heroku
 * This script will:
 * 1. Create a temporary branch
 * 2. Commit the changes to the survey system
 * 3. Push to Heroku for deployment
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEMP_BRANCH = 'fix/survey-system-json-parsing';
const COMMIT_MESSAGE = 'Fix JSON parsing in survey system, add type safety improvements';

// Helper to execute commands and log output
function execute(command, options = {}) {
  console.log(`Executing: ${command}`);
  try {
    const output = execSync(command, {
      stdio: 'inherit',
      ...options
    });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Check if we're in the root directory of the project
if (!fs.existsSync(path.join(process.cwd(), 'package.json')) ||
    !fs.existsSync(path.join(process.cwd(), 'backend'))) {
  console.error('Please run this script from the root directory of the project');
  process.exit(1);
}

// Main deployment process
function deploy() {
  console.log('Starting deployment of survey system fix to Heroku...');

  // Get current branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Current branch: ${currentBranch}`);

  try {
    // Create a temporary branch
    console.log(`Creating temporary branch: ${TEMP_BRANCH}`);
    execute(`git checkout -b ${TEMP_BRANCH}`);

    // Add files to staging
    console.log('Adding modified files to git staging...');
    execute('git add backend/src/services/SurveyService.ts');
    execute('git add backend/src/routes/survey.ts');
    
    // Commit changes
    console.log('Committing changes...');
    execute(`git commit -m "${COMMIT_MESSAGE}"`);

    // Push to Heroku
    console.log('Pushing to Heroku...');
    execute('git push heroku HEAD:main -f');

    console.log('\n✅ Survey system fix deployed successfully to Heroku!');
    console.log('\nThe fix addresses issues with JSON data format handling in the survey system.');
    console.log('Users should now be able to view survey response details without errors.\n');

    // Deployment complete, switch back to original branch
    console.log(`Switching back to original branch: ${currentBranch}`);
    execute(`git checkout ${currentBranch}`);

    // Clean up: delete temporary branch
    console.log(`Cleaning up: Deleting temporary branch ${TEMP_BRANCH}`);
    execute(`git branch -D ${TEMP_BRANCH}`);

  } catch (error) {
    console.error('Deployment failed:', error);
    
    // Try to return to the original branch on error
    try {
      console.log(`Attempting to switch back to original branch: ${currentBranch}`);
      execute(`git checkout ${currentBranch}`);
    } catch (checkoutError) {
      console.error('Failed to switch back to original branch:', checkoutError);
    }
    
    process.exit(1);
  }
}

// Execute the deployment
deploy();
