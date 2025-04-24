// scripts/deploy_roadmap_to_heroku.js

const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Deploys the roadmap feature to Heroku
 * - Fixes mobile authentication with unified strategy
 * - Implements pure React/Tailwind roadmap without Material UI dependencies
 */
async function deployRoadmap() {
  try {
    console.log('Deploying roadmap feature to Heroku...');
    
    // Create and switch to deployment branch
    const timestamp = Date.now();
    const branchName = `roadmap-deploy-${timestamp}`;
    execSync(`git checkout -b ${branchName}`);
    console.log(`Created deployment branch: ${branchName}`);
    
    // Update build trigger file for Heroku
    fs.writeFileSync('.build-trigger', `Roadmap Feature Deployment ${new Date().toISOString()}\n`);
    
    // Commit all changes
    execSync('git add .');
    execSync('git commit -m "Add roadmap feature using pure React/Tailwind (iOS compatible)"');
    console.log('Changes committed');
    
    // Push to Heroku
    execSync('git push heroku HEAD:main -f');
    console.log('✅ Deployed to Heroku successfully');
    
    // Return to main branch
    execSync('git checkout main');
    console.log('Returned to main branch');
    
    return true;
  } catch (error) {
    console.error('Deployment failed:', error);
    return false;
  }
}

deployRoadmap()
  .then(success => console.log(success ? 'Deployment completed' : 'Deployment failed'))
  .catch(err => console.error('Deployment error:', err));