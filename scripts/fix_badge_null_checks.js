/**
 * Fix for badge null checks in the dashboard
 * 
 * The error "Cannot convert undefined or null to object" is happening because
 * Object.values() is being called on potentially null or undefined values
 * after authentication is successful but before badge data is ready.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-badge-null-checks';

try {
  console.log('\n=== FIXING BADGE NULL CHECKS ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Path to service files
  const badgeServicePath = path.join(currentDir, 'src', 'services', 'badgeService.ts');
  const hookPath = path.join(currentDir, 'src', 'hooks', 'useBadgeProgress.ts');
  
  // Make backups of the current files
  const badgeServiceBackupPath = path.join(currentDir, 'src', 'services', 'badgeService.ts.null-check-backup');
  const hookBackupPath = path.join(currentDir, 'src', 'hooks', 'useBadgeProgress.ts.null-check-backup');
  
  if (!fs.existsSync(badgeServiceBackupPath)) {
    console.log('Creating backup of current badgeService.ts...');
    fs.copyFileSync(badgeServicePath, badgeServiceBackupPath);
  }
  
  if (!fs.existsSync(hookBackupPath)) {
    console.log('Creating backup of current useBadgeProgress.ts...');
    fs.copyFileSync(hookPath, hookBackupPath);
  }
  
  // 1. Fix badgeService.ts
  console.log('Updating badgeService.ts with null checks...');
  let badgeServiceContent = fs.readFileSync(badgeServicePath, 'utf8');
  
  // Fix getAllBadges fallback
  badgeServiceContent = badgeServiceContent.replace(
    'return Object.values(BADGES);',
    'return BADGES ? Object.values(BADGES) : [];'
  );
  
  // Fix getUserPoints fallback
  badgeServiceContent = badgeServiceContent.replace(
    'const earnedBadgeCount = Object.values(badges).filter(b => b.earned).length;',
    'const earnedBadgeCount = badges ? Object.values(badges).filter(b => b.earned).length : 0;'
  );
  
  // Fix getRecentAchievements
  badgeServiceContent = badgeServiceContent.replace(
    'const earnedBadges = Object.values(userBadges)',
    'const earnedBadges = userBadges ? Object.values(userBadges)'
  );
  
  // Fix getRecentAchievements fallback
  badgeServiceContent = badgeServiceContent.replace(
    'const earnedBadges = Object.values(badges)',
    'const earnedBadges = badges ? Object.values(badges)'
  );
  
  // Write updated content back
  fs.writeFileSync(badgeServicePath, badgeServiceContent);
  
  // 2. Fix useBadgeProgress.ts
  console.log('Updating useBadgeProgress.ts with null checks...');
  let hookContent = fs.readFileSync(hookPath, 'utf8');
  
  // Add default empty object for userBadges
  hookContent = hookContent.replace(
    'const [userBadges, setUserBadges] = useState<Record<string, UserBadge>>({});',
    'const [userBadges, setUserBadges] = useState<Record<string, UserBadge> | null>({});'
  );
  
  // Update earnedBadges with null check
  hookContent = hookContent.replace(
    'earnedBadges: Object.values(userBadges).filter(badge => badge.earned),',
    'earnedBadges: userBadges ? Object.values(userBadges).filter(badge => badge.earned) : [],' 
  );
  
  // Update inProgressBadges with null check
  hookContent = hookContent.replace(
    'inProgressBadges: Object.values(userBadges).filter(badge => !badge.earned && badge.progress > 0),',
    'inProgressBadges: userBadges ? Object.values(userBadges).filter(badge => !badge.earned && badge.progress > 0) : [],' 
  );
  
  // Update lockedBadges with null check
  hookContent = hookContent.replace(
    'lockedBadges: Object.values(userBadges).filter(badge => !badge.earned && badge.progress === 0),',
    'lockedBadges: userBadges ? Object.values(userBadges).filter(badge => !badge.earned && badge.progress === 0) : [],' 
  );
  
  // Write updated content back
  fs.writeFileSync(hookPath, hookContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${badgeServicePath} ${hookPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Add null checks for Object.values calls in badge components"', { stdio: 'inherit' });
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    console.log('Successfully pushed to GitHub');
  } catch (error) {
    console.error('Failed to push to GitHub. This is non-critical for the Heroku deployment.');
    console.error(`Error: ${error.message}`);
  }
  
  // Deploy to Heroku
  console.log('\n=== DEPLOYING TO HEROKU ===\n');
  try {
    execSync(`git push heroku ${branchName}:main -f`, { stdio: 'inherit' });
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('Badge null check fix has been deployed to Heroku.');
    console.log('The dashboard achievements tab should now load properly without "Cannot convert undefined or null to object" errors.');
  } catch (error) {
    console.error('\n=== DEPLOYMENT FAILED ===\n');
    console.error('Failed to deploy to Heroku. Error:');
    console.error(error.message);
    console.error('\nYou may need to deploy manually using:');
    console.error(`git push heroku ${branchName}:main -f`);
  }
  
  // Verification instructions
  console.log('\n=== VERIFICATION STEPS ===\n');
  console.log('1. Open the application in your browser at https://energy-audit-store-e66479ed4f2b.herokuapp.com');
  console.log('2. Clear your browser cache and cookies or use incognito mode');
  console.log('3. Log in with your credentials');
  console.log('4. Go to the dashboard page and verify the achievements tab loads properly');
  console.log('5. Open browser developer tools (F12) and verify that there are no more:');
  console.log('   "TypeError: Cannot convert undefined or null to object" errors');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred while fixing badge null checks:');
  console.error(error.message);
  process.exit(1);
}
