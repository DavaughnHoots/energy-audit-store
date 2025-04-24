// Sync local repository with Heroku v655 deployment and update GitHub
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('====================================================================');
console.log('HEROKU v655 SYNC SCRIPT');
console.log('This script will sync your local repository with the live Heroku deployment (v655)');
console.log('====================================================================\n');

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, '../.backups', `pre-heroku-sync-${Date.now()}`);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`Created backup directory at ${backupDir}`);
}

// Save current branch information before making changes
try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Current branch: ${currentBranch}`);
  
  // Create a backup branch
  const backupBranchName = `backup-${currentBranch}-${Date.now()}`;
  console.log(`Creating backup branch: ${backupBranchName}...`);
  
  execSync(`git branch ${backupBranchName}`);
  console.log(`Backup branch created.`);
  
  // Make sure we have the Heroku remote
  try {
    console.log('Checking Heroku remote...');
    const remotes = execSync('git remote -v').toString();
    
    if (!remotes.includes('heroku')) {
      console.error('ERROR: Heroku remote not found. Please set up the Heroku remote first.');
      console.error('Use: git remote add heroku https://git.heroku.com/energy-audit-store.git');
      process.exit(1);
    }
    
    console.log('Heroku remote found.');
    
    // First, fetch from Heroku to get the latest code
    console.log('\nFetching from Heroku...');
    execSync('git fetch heroku', { stdio: 'inherit' });
    
    // Create a temporary branch based on Heroku's main branch
    const tempBranch = `heroku-v655-temp-${Date.now()}`;
    console.log(`\nCreating temporary branch ${tempBranch} from heroku/main...`);
    execSync(`git checkout -b ${tempBranch} heroku/main`, { stdio: 'inherit' });
    
    // Now we need to stage all changes to keep the Heroku version
    console.log('\nStaging all changes from Heroku version...');
    execSync('git add -A', { stdio: 'inherit' });
    
    // Commit those changes
    console.log('\nCommitting Heroku v655 state...');
    execSync(`git commit -m "Sync with Heroku v655 deployment"`, { stdio: 'inherit' });
    
    // If the user wants to update their current branch with this code:
    console.log('\n====================================================================');
    console.log(`IMPORTANT: Your current branch (${currentBranch}) is now different from what's on Heroku.`);
    console.log(`You can manually merge the changes from ${tempBranch} into your working branch with:`);
    console.log(`\ngit checkout ${currentBranch}`);
    console.log(`git merge ${tempBranch}`);
    console.log(`\nAlternatively, to completely replace your branch with Heroku's version:`);
    console.log(`git checkout ${currentBranch}`);
    console.log(`git reset --hard ${tempBranch}`);
    console.log('\nTo push this to GitHub:');
    console.log('git push origin -f');
    console.log('\nYou can also create a clean branch from the Heroku version with:');
    console.log('git checkout -b new-heroku-v655-branch');
    console.log('git push origin new-heroku-v655-branch');
    console.log('====================================================================');
    
    // Return to the original branch
    console.log(`\nReturning to your original branch (${currentBranch})...`);
    execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
    
    console.log('\nSync process completed.');
    console.log(`Your Heroku v655 code is now available in the branch: ${tempBranch}`);
    console.log('Please follow the instructions above to update your working branch or push to GitHub.');
    
  } catch (error) {
    console.error('Error during Heroku sync process:', error.message);
    console.log('Attempting to return to your original branch...');
    execSync(`git checkout ${currentBranch}`, { stdio: 'inherit' });
    console.log('You may need to manually resolve this issue.');
  }
  
} catch (error) {
  console.error('Error determining current branch:', error);
  console.log('Cannot proceed with the sync operation.');
}
