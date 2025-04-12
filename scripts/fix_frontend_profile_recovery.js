/**
 * Fix for frontend profile recovery to handle the backend response format
 * 
 * The backend returns user profile data directly, but the frontend expects it wrapped in a 'user' property
 * This script modifies the useAuth.ts hook to handle both formats
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-frontend-profile-recovery';

try {
  console.log('\n=== FIXING FRONTEND PROFILE RECOVERY ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Path to useAuth.ts hook file
  const useAuthPath = path.join(currentDir, 'src', 'hooks', 'useAuth.ts');
  
  // Make a backup of the current file
  const backupPath = path.join(currentDir, 'src', 'hooks', 'useAuth.ts.profile-recovery-backup');
  if (!fs.existsSync(backupPath)) {
    console.log('Creating backup of current useAuth.ts...');
    fs.copyFileSync(useAuthPath, backupPath);
  }
  
  // Read the useAuth.ts file
  console.log('Reading useAuth.ts file...');
  let useAuthContent = fs.readFileSync(useAuthPath, 'utf8');
  
  // Find the profile recovery block and modify it to handle both response formats
  console.log('Updating profile recovery process to handle direct user data response...');
  
  // Look for the profile recovery code in the useAuth.ts file
  const profileRecoveryPattern = /try\s*{[\s\S]*?const\s+response\s*=\s*await\s+apiClient\.get[\s\S]*?\/auth\/profile[\s\S]*?if\s*\(response\.data\.user\)[\s\S]*?}\s*else\s*{[\s\S]*?console\.warn\('Profile\s+endpoint\s+returned\s+success\s+but\s+no\s+user\s+data'\);[\s\S]*?}[\s\S]*?}\s*catch\s*\([\s\S]*?\)\s*{[\s\S]*?}/;
  
  // Updated code that handles both wrapped and direct response formats
  const updatedProfileRecovery = `try {
              const response = await apiClient.get<{ user: User } | User>('/auth/profile');
              
              // Handle both response formats: { user: User } OR User directly
              let userData: User | null = null;
              
              if (response.data) {
                // Check if response has a user property (old format)
                if ('user' in response.data && response.data.user) {
                  userData = response.data.user;
                } 
                // Check if response has direct user data (id, email properties - new format)
                else if ('id' in response.data || 'userId' in response.data) {
                  // If response has userId but not id, map userId to id
                  userData = {
                    ...response.data,
                    id: response.data.id || response.data.userId
                  } as User;
                }
              }
              
              if (userData) {
                // Save the recovered user data
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                console.log('User profile recovered successfully from HttpOnly cookies');
              } else {
                console.warn('Profile endpoint returned success but data format unexpected:', response.data);
              }
            } catch (profileError) {
              console.error('Error recovering user profile from HttpOnly cookies:', profileError);
            }`;
  
  // Replace the profile recovery block with the updated code
  const updatedContent = useAuthContent.replace(profileRecoveryPattern, updatedProfileRecovery);
  
  // Write the updated content back to the file
  console.log('Writing changes to useAuth.ts...');
  fs.writeFileSync(useAuthPath, updatedContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${useAuthPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Update frontend profile recovery to handle direct user data format"', { stdio: 'inherit' });
  
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
    console.log('Frontend profile recovery fix has been deployed to Heroku.');
    console.log('The auth system should now correctly handle the profile data format from the backend.');
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
  console.log('4. Go to the dashboard page and verify it loads properly');
  console.log('5. Go to the achievements tab and verify it loads properly');
  console.log('6. Open browser developer tools (F12) and verify that the console no longer shows:');
  console.log('   "Profile endpoint returned success but no user data"');
  console.log('\nIf you encounter any further issues, check the server logs for details.\n');
  
} catch (error) {
  console.error('\n=== FIX FAILED ===\n');
  console.error('An error occurred during the frontend profile recovery fix:');
  console.error(error.message);
  process.exit(1);
}
