/**
 * Direct Mobile Authentication Fix Deploy
 * 
 * This script directly deploys the iOS/mobile authentication fixes to Heroku
 * without relying on Git branch management.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Function to create a temporary directory
function createTempDir() {
  const tempDir = path.join(__dirname, '..', 'temp_deploy');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Created temporary directory: ${tempDir}`);
  } else {
    console.log(`Using existing temporary directory: ${tempDir}`);
  }
  return tempDir;
}

function copyFilesToTempDir(files, tempDir) {
  files.forEach(file => {
    const sourceFile = path.join(__dirname, '..', file);
    const targetDir = path.join(tempDir, path.dirname(file));
    const targetFile = path.join(tempDir, file);
    
    // Create directory structure if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Copied: ${file} to ${targetFile}`);
  });
}

function main() {
  console.log('🚀 Starting direct deployment of iOS/mobile authentication fixes...');

  // Files that need to be deployed
  const filesToDeploy = [
    'src/utils/cookieUtils.ts',
    'src/context/AuthContext.tsx',
    'src/types/auth.ts',
    'src/services/apiClient.ts'
  ];
  
  // Create temp directory and copy files
  const tempDir = createTempDir();
  copyFilesToTempDir(filesToDeploy, tempDir);
  
  // Deploy to Heroku using Heroku CLI
  console.log('Deploying to Heroku...');
  process.chdir(path.join(__dirname, '..'));
  
  // Commit changes locally
  executeCommand('git add .');
  executeCommand('git commit -m "Fix iOS & mobile authentication issues"');
  
  // Push directly to Heroku main
  const herokuResult = executeCommand('git push heroku HEAD:main --force');
  
  if (herokuResult.success) {
    console.log('✅ Successfully deployed mobile authentication fixes to Heroku!');
    
    // Check logs
    console.log('📊 Fetching Heroku logs to verify deployment...');
    executeCommand('heroku logs --tail --app energy-audit-store');
  } else {
    console.error('❌ Failed to deploy to Heroku. Check the error message above.');
  }
}

// Execute main script
main();
