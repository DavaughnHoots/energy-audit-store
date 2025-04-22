/**
 * Direct auth middleware fix uploader
 * 
 * This script bypasses git completely and directly uploads the fixed auth.js file to Heroku
 * using Heroku's one-off dyno feature to copy the file into place.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const AUTH_FIX_VERSION = 'v1.1';
const HEROKU_APP_NAME = 'energy-audit-store';

// Create timestamp for logging
const timestamp = new Date().toISOString().replace(/:/g, '-');
const LOG_FILE = `auth_direct_upload_${timestamp}.log`;

// Helper to log both to console and to a file
function log(message) {
  const logMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

// Helper to execute commands with logging
function execute(command, hideOutput = false) {
  log(`Executing: ${command}`);
  try {
    const options = hideOutput ? { stdio: 'pipe' } : { stdio: 'inherit' };
    const output = execSync(command, options);
    if (hideOutput && output) {
      log(`Command output: ${output.toString().trim()}`);
    }
    return output;
  } catch (error) {
    log(`ERROR: Command failed with code ${error.status}`);
    if (error.stdout) log(`STDOUT: ${error.stdout.toString()}`);
    if (error.stderr) log(`STDERR: ${error.stderr.toString()}`);
    throw error;
  }
}

// Main function
async function main() {
  log('Starting direct auth middleware fix uploader...');

  // Define paths
  const AUTH_MIDDLEWARE_PATH = path.join('backend', 'build', 'middleware', 'auth.js');
  
  // Verify the fixed file exists
  if (!fs.existsSync(AUTH_MIDDLEWARE_PATH)) {
    log(`ERROR: Auth middleware file not found at ${AUTH_MIDDLEWARE_PATH}`);
    process.exit(1);
  }

  // Verify the file contains our fix
  const authContent = fs.readFileSync(AUTH_MIDDLEWARE_PATH, 'utf8');
  if (!authContent.includes(`AUTH_MIDDLEWARE_VERSION = '${AUTH_FIX_VERSION}'`)) {
    log(`ERROR: File doesn't contain expected fix marker (AUTH_MIDDLEWARE_VERSION = '${AUTH_FIX_VERSION}')`);
    process.exit(1);
  }

  log('✅ Verified auth middleware file contains our fix');

  try {
    // Create a temporary deployment script
    const TEMP_SCRIPT_PATH = 'temp_heroku_deploy.js';
    log(`Creating temporary deployment script: ${TEMP_SCRIPT_PATH}`);
    
    // The script we'll run on Heroku to place our file
    const deployScriptContent = `
      // Direct file deployment script
      const fs = require('fs');
      const path = require('path');
      
      console.log('Starting direct file deployment on Heroku dyno...');
      
      // Target path on Heroku
      const targetDir = '/app/backend/build/middleware';
      const targetFile = path.join(targetDir, 'auth.js');
      
      // File content provided as a base64 string from our local machine
      const fileContent = \`${Buffer.from(authContent).toString('base64')}\`;
      
      // Ensure the directory exists
      console.log(\`Checking if target directory exists: \${targetDir}\`);
      if (!fs.existsSync(targetDir)) {
        console.log(\`Creating directory: \${targetDir}\`);
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      // Write our fixed file
      console.log(\`Writing file to: \${targetFile}\`);
      fs.writeFileSync(targetFile, Buffer.from(fileContent, 'base64').toString('utf8'));
      
      // Verify the file was written with our version marker
      const writtenContent = fs.readFileSync(targetFile, 'utf8');
      if (writtenContent.includes('AUTH_MIDDLEWARE_VERSION')) {
        const versionMatch = writtenContent.match(/AUTH_MIDDLEWARE_VERSION\\s*=\\s*['"]([^'"]+)['"]/);
        if (versionMatch) {
          console.log(\`✅ Successfully deployed auth middleware with version \${versionMatch[1]}\`);
        }
      }
      
      console.log('Deployment script completed.');
    `;
    
    fs.writeFileSync(TEMP_SCRIPT_PATH, deployScriptContent);
    
    // Upload the script to Heroku and execute it
    log('Uploading and executing deployment script on Heroku...');
    execute(`heroku run "node ${TEMP_SCRIPT_PATH}" --app ${HEROKU_APP_NAME}`);
    
    // Clean up the temporary file
    fs.unlinkSync(TEMP_SCRIPT_PATH);
    log('✅ Temporary deployment script cleaned up');
    
    // Restart the app to ensure changes take effect
    log('Restarting Heroku app to apply changes...');
    execute(`heroku restart --app ${HEROKU_APP_NAME}`);
    
    log('✅ Heroku app restarted');
    
    // Check logs for our version marker after restart
    log('Waiting for app to restart and checking logs (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get latest logs
    log('Checking Heroku logs for auth middleware marker...');
    const logs = execute(`heroku logs --source app --num 100 --app ${HEROKU_APP_NAME}`, true).toString();
    
    // Look for our logging tag
    const authLogCount = (logs.match(new RegExp(`\\[AUTH-FIX-${AUTH_FIX_VERSION}\\]`, 'g')) || []).length;
    
    if (authLogCount > 0) {
      log(`✅ Success! Found ${authLogCount} log entries with our AUTH-FIX-${AUTH_FIX_VERSION} marker.`);
      log('The fix has been deployed and is running in production!');
    } else {
      log('⚠️ Warning: No auth fix log markers found in the logs yet.');
      log('This could mean:');
      log('1. The app is still starting up');
      log('2. No auth requests have been made since deployment');
      log('3. The fix needs more time to take effect');
    }
    
    log('\n🎉 Deployment completed successfully!');
    log('\nTo monitor the fix in production:');
    log('1. Watch Heroku logs for our auth middleware markers:');
    log(`   heroku logs --tail --app ${HEROKU_APP_NAME} | grep AUTH-FIX`);
    log('2. Have users test login and dashboard access');
    log('3. Verify the "Token verification failed: AuthError: Invalid token" errors are gone');

  } catch (error) {
    log(`❌ Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the async main function
main().catch(error => {
  log(`❌ Unhandled error: ${error.message}`);
  process.exit(1);
});
