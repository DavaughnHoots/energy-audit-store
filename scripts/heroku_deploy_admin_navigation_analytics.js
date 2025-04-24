/**
 * Deployment script for admin navigation analytics feature
 * Used to deploy the navigation analytics API and frontend components
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Deploying admin navigation analytics feature to Heroku...');
  
  // Update the build trigger file to force a rebuild
  const triggerPath = path.join(__dirname, '..', '.build-trigger');
  fs.writeFileSync(triggerPath, new Date().toISOString());
  console.log('Updated build trigger file');

  // Add files to git
  console.log('Adding files to git...');
  execSync('git add .');
  console.log('Files added to git');

  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Add admin navigation analytics feature"');
  console.log('Changes committed');
  
  // Push to Heroku
  console.log('Pushing to Heroku...');
  execSync('git push heroku main:master --force');
  console.log('Successfully pushed to Heroku');
  
  console.log('Admin navigation analytics feature deployment completed successfully!');
} catch (error) {
  console.error('Error deploying admin navigation analytics feature:', error);
  process.exit(1);
}
