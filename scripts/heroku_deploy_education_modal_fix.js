// scripts/heroku_deploy_education_modal_fix.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Deployment metadata
const deploymentInfo = {
  name: 'Education Modal Fix',
  description: 'Fix for the resource detail modal rendering within the page flow instead of as an overlay',
  components: [
    'src/components/ui/Dialog.tsx',
    'src/components/education/ResourceDetailModal.tsx'
  ],
  date: new Date().toISOString(),
  developer: 'System',
  version: '1.0.0'
};

// Log deployment information
console.log('===== Education Modal Fix Deployment =====');
console.log(`Date: ${new Date().toLocaleString()}`);
console.log(`Description: ${deploymentInfo.description}`);
console.log('Modified files:');
deploymentInfo.components.forEach(component => console.log(`- ${component}`));
console.log('==========================================\n');

try {
  // Check if we're on the correct branch
  const currentBranch = execSync('git branch --show-current').toString().trim();
  if (currentBranch !== 'main') {
    console.log(`⚠️ Warning: You're deploying from '${currentBranch}' branch, not 'main'`);
    console.log('Continuing deployment anyway...\n');
  }

  // Step 1: Stage the changes
  console.log('Step 1: Staging changes...');
  deploymentInfo.components.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`git add ${file}`);
      console.log(`✓ Staged ${file}`);
    } else {
      console.log(`❌ File not found: ${file}`);
    }
  });

  // Step 2: Commit the changes
  console.log('\nStep 2: Committing changes...');
  execSync(`git commit -m "Fix: Education resource modal rendering issue"`);
  console.log('✓ Changes committed');

  // Step 3: Push to GitHub
  console.log('\nStep 3: Pushing to GitHub...');
  execSync('git push origin main');
  console.log('✓ Changes pushed to GitHub');

  // Step 4: Deploy to Heroku
  console.log('\nStep 4: Deploying to Heroku...');
  execSync('git push heroku main');
  console.log('✓ Changes deployed to Heroku');

  // Log deployment completion
  console.log('\n✅ Deployment completed successfully!');
  console.log('==========================================');
  
  // Write deployment record
  const deploymentRecord = `
Date: ${new Date().toLocaleString()}
Name: ${deploymentInfo.name}
Description: ${deploymentInfo.description}
Modified files: ${deploymentInfo.components.join(', ')}
Developer: ${deploymentInfo.developer}
Version: ${deploymentInfo.version}
Status: Success
  `;
  
  fs.appendFileSync('deployment_history.log', deploymentRecord);
  console.log('Deployment record created in deployment_history.log');

} catch (error) {
  console.error('\n❌ Deployment failed:');
  console.error(error.message);
  
  // Attempt to provide helpful error resolution
  if (error.message.includes('git')) {
    console.log('\nTroubleshooting Git issues:');
    console.log('1. Check your Git installation: git --version');
    console.log('2. Verify remote settings: git remote -v');
    console.log('3. Try authenticating manually first: git push origin main');
  }
  
  if (error.message.includes('heroku')) {
    console.log('\nTroubleshooting Heroku issues:');
    console.log('1. Check Heroku CLI installation: heroku --version');
    console.log('2. Verify you are logged in: heroku auth:whoami');
    console.log('3. Confirm app association: heroku apps');
  }
  
  // Write deployment failure record
  const deploymentRecord = `
Date: ${new Date().toLocaleString()}
Name: ${deploymentInfo.name}
Description: ${deploymentInfo.description}
Modified files: ${deploymentInfo.components.join(', ')}
Developer: ${deploymentInfo.developer}
Version: ${deploymentInfo.version}
Status: Failed
Error: ${error.message}
  `;
  
  fs.appendFileSync('deployment_history.log', deploymentRecord);
  console.log('Deployment failure record created in deployment_history.log');
}
