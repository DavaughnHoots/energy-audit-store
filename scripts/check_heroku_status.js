#!/usr/bin/env node

/**
 * Heroku Status Check
 * 
 * This script checks the Heroku application status and restarts it if necessary.
 */

const { execSync } = require('child_process');
const https = require('https');

const HEROKU_APP_NAME = 'energy-audit-store';

console.log('🔎 Checking Heroku application status...');

// Function to check if the app is responding
async function checkAppStatus() {
  return new Promise((resolve) => {
    const options = {
      hostname: `${HEROKU_APP_NAME}-e66479ed4f2b.herokuapp.com`,
      port: 443,
      path: '/health',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`✅ Application is responding with status code ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('Response:', data);
          resolve(true);
        });
      } else {
        console.log(`⚠️ Application responded with status code ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.error(`❌ Error connecting to application: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('❌ Connection timed out');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Function to check Heroku dyno status
function checkDynoStatus() {
  try {
    console.log('🔍 Checking Heroku dyno status...');
    const output = execSync(`heroku ps --app ${HEROKU_APP_NAME}`, { encoding: 'utf8' });
    console.log(output);
    return output.includes('web.1') && !output.includes('crashed');
  } catch (error) {
    console.error('❌ Error checking dyno status:', error.message);
    console.log('⚠️ You may need to log in to Heroku CLI first using "heroku login"');
    return false;
  }
}

// Function to restart the app
function restartApp() {
  try {
    console.log('🔄 Restarting Heroku application...');
    const output = execSync(`heroku restart --app ${HEROKU_APP_NAME}`, { encoding: 'utf8' });
    console.log(output);
    return true;
  } catch (error) {
    console.error('❌ Error restarting application:', error.message);
    return false;
  }
}

// Function to view recent logs
function viewLogs() {
  try {
    console.log('📜 Recent application logs:');
    const output = execSync(`heroku logs --app ${HEROKU_APP_NAME} --num 50`, { encoding: 'utf8' });
    console.log(output);
  } catch (error) {
    console.error('❌ Error fetching logs:', error.message);
  }
}

// Main function
async function main() {
  // First check if the app is responding
  const isResponding = await checkAppStatus();
  
  if (!isResponding) {
    // If not responding, check dyno status
    const isRunning = checkDynoStatus();
    
    if (!isRunning) {
      console.log('⚠️ Application appears to be down');
      
      // Restart the app
      const restartSuccess = restartApp();
      
      if (restartSuccess) {
        console.log('✅ Application restart initiated');
        console.log('⏳ Waiting 15 seconds for application to start...');
        
        // Wait for 15 seconds to give the app time to start
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Check again if the app is responding
        const isRespondingAfterRestart = await checkAppStatus();
        
        if (isRespondingAfterRestart) {
          console.log('✅ Application is now responding');
        } else {
          console.log('❌ Application is still not responding after restart');
          viewLogs();
        }
      } else {
        console.log('❌ Failed to restart application');
      }
    } else {
      console.log('⚠️ Dynos are running but application is not responding');
      // This could be due to an application error rather than infrastructure
      viewLogs();
    }
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ An unexpected error occurred:', error);
});
