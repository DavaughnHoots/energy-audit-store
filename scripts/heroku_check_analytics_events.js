// scripts/heroku_check_analytics_events.js
// Run database check on Heroku

const { execSync } = require('child_process');

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

// Run the script remotely on Heroku
try {
  executeCommand('heroku run node scripts/check_analytics_events_db.js');
} catch (error) {
  console.error('Failed to run analytics check on Heroku:', error);
  process.exit(1);
}
