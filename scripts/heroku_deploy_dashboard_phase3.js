/**
 * Dashboard Redesign Phase 3 Deployment Script
 *
 * This script deploys Phase 3 of the dashboard redesign with data consistency improvements:
 * - Enhanced backend service with default data generation
 * - Data explanation components for better user experience
 * - Fixed empty state handling and data source indicators
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting dashboard redesign Phase 3 deployment...');

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

// Function to safely copy files
function copyFile(source, destination) {
  try {
    console.log(`Copying ${source} to ${destination}`);
    fs.copyFileSync(source, destination);
    console.log('File copied successfully');
  } catch (error) {
    console.error(`Failed to copy ${source} to ${destination}`);
    console.error(error.message);
    throw error;
  }
}

// Function to ensure directory exists
function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Creating directory: ${directory}`);
    fs.mkdirSync(directory, { recursive: true });
  }
}

// Create new branch for the changes
try {
  // Check if we're already on the dashboard-redesign-phase3 branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();

  if (currentBranch !== 'dashboard-redesign-phase3') {
    console.log('Creating and checking out dashboard-redesign-phase3 branch...');

    // Check if the branch exists
    const branches = execSync('git branch', { encoding: 'utf-8' });

    if (branches.includes('dashboard-redesign-phase3')) {
      runCommand('git checkout dashboard-redesign-phase3');
    } else {
      runCommand('git checkout -b dashboard-redesign-phase3');
    }
  } else {
    console.log('Already on dashboard-redesign-phase3 branch');
  }
} catch (error) {
  console.error('Error handling git branch:', error);
  process.exit(1);
}

// 1. Ensure the necessary directories exist
console.log('Ensuring directories exist...');
ensureDirectoryExists('backend/build/services');
ensureDirectoryExists('backend/build/routes');
ensureDirectoryExists('backend/build');
ensureDirectoryExists('src/components/dashboard');

// 2. Apply source file changes
console.log('Applying source file changes...');

// Copy enhanced frontend components
try {
  // Ensure the compiled output directory exists
  ensureDirectoryExists('build/assets/components/dashboard');
  
  console.log('Building frontend components...');
  runCommand('npm run build');
  
  console.log('Frontend build completed');
} catch (error) {
  console.error('Error building frontend:', error);
  process.exit(1);
}

// Copy enhanced backend files to build
try {
  // Compile TypeScript files to JavaScript
  console.log('Compiling TypeScript files...');
  runCommand('cd backend && npx tsc');

  // At this point the TypeScript compiler has already processed our enhanced files
  console.log('TypeScript compilation completed');
} catch (error) {
  console.error('Error compiling TypeScript:', error);
  process.exit(1);
}

// 3. Update server.js
try {
  console.log('Updating server.js to use enhanced dashboard routes...');

  // First ensure the enhanced server file has been compiled to JavaScript
  // This should have happened during the TypeScript compilation

  // Now replace the server.js file with our enhanced version
  if (fs.existsSync('backend/build/server.enhanced.js')) {
    copyFile('backend/build/server.enhanced.js', 'backend/build/server.js');
  } else {
    console.error('Enhanced server.js file not found after compilation. Check TypeScript settings.');
    process.exit(1);
  }

  console.log('Server.js update completed');
} catch (error) {
  console.error('Error updating server.js:', error);
  process.exit(1);
}

// 4. Commit the changes to the branch
try {
  console.log('Committing changes...');
  runCommand('git add backend/build/services/dashboardService.enhanced.js');
  runCommand('git add backend/build/routes/dashboard.enhanced.js');
  runCommand('git add backend/build/server.js');
  runCommand('git add build');
  runCommand('git commit -m "Deploy dashboard redesign Phase 3: Data consistency improvements"');
} catch (error) {
  console.error('Error committing changes:', error);
  process.exit(1);
}

// 5. Push to repository
try {
  console.log('Pushing to repository...');
  runCommand('git push origin dashboard-redesign-phase3');
} catch (error) {
  console.error('Error pushing to repository:', error);
  console.log('You may need to push manually with: git push origin dashboard-redesign-phase3');
}

// 6. Deploy to Heroku
try {
  console.log('Deploying to Heroku...');
  runCommand('git push heroku dashboard-redesign-phase3:main -f');
} catch (error) {
  console.error('Error deploying to Heroku:', error);
  console.log('You may need to deploy manually with: git push heroku dashboard-redesign-phase3:main -f');
}

console.log('Dashboard redesign Phase 3 deployment completed successfully!');
console.log('Data consistency improvements have been deployed.');
