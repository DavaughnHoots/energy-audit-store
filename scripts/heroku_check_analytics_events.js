// scripts/heroku_check_analytics_events.js
// This script serves as a wrapper to execute check_analytics_events.js on Heroku

const { execSync } = require('child_process');

console.log('Executing analytics events check on Heroku...');

try {
  // Execute the Heroku command to run the script
  const output = execSync('heroku run node backend/build/scripts/check_analytics_events.js --app energy-audit-store', { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  // Output is already shown via inherit stdio, but we'll log a completion message
  console.log('Analytics events check completed.');
} catch (error) {
  console.error('Error executing the analytics events check on Heroku:', error.message);
  process.exit(1);
}
