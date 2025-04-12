/**
 * Deployment script for fixing profile data extraction issue
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-profile-data-extraction';

try {
  console.log('\n=== STARTING DEPLOYMENT OF PROFILE DATA EXTRACTION FIX ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // 1. First, fix the syntax error in auth-cors.js middleware
  const authCorsPath = path.join(currentDir, 'backend', 'src', 'middleware', 'auth-cors.js');
  let authCorsContent = fs.readFileSync(authCorsPath, 'utf8');
  
  // Fix the syntax error in auth-cors.js
  authCorsContent = authCorsContent.replace(
    /fullUrl: req\.originalUrl,\s*\n\s*path: req\.path,/g,
    'fullUrl: req.originalUrl,\n      path: req.path,'
  );

  authCorsContent = authCorsContent.replace(
    /isAuthRoute: true \/\/ Already in \/api\/auth path,/g,
    'isAuthRoute: true, // Already in /api/auth path'
  );
  
  // Save the fixed auth-cors.js
  console.log('Writing updated auth-cors.js middleware...');
  fs.writeFileSync(authCorsPath, authCorsContent);
  
  // 2. Enhance the context/AuthContext.tsx to better extract profile data
  const authContextPath = path.join(currentDir, 'src', 'context', 'AuthContext.tsx');
  let authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  // Improve the profile data extraction in checkAuthStatus function
  // Look for the part where it extracts user profile data
  const profileExtractRegex = /const userData = await response\.json\(\);\s*console\.log\('Profile fetch successful'\);/;
  authContextContent = authContextContent.replace(
    profileExtractRegex,
    `try {
            // Try to extract the data in multiple ways to ensure compatibility
            let userData;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const responseText = await response.text();
              console.log('Raw profile response text:', responseText);
              
              // Attempt to parse JSON even for 304 responses
              if (responseText && responseText.trim()) {
                try {
                  userData = JSON.parse(responseText);
                  console.log('Successfully parsed profile JSON');
                } catch (e) {
                  console.error('Error parsing profile JSON:', e);
                }
              } else {
                console.warn('Empty response body from profile endpoint');
              }
            } else {
              console.warn('Unexpected content-type from profile endpoint:', contentType);
            }
            
            if (!userData) {
              throw new Error('Failed to parse profile data from response');
            }
            
            console.log('Profile fetch successful with data:', userData);`
  );
  
  // Update the error handling for profile data
  const profileErrorRegex = /console\.log\('Profile endpoint returned success but no user data'\);/;
  authContextContent = authContextContent.replace(
    profileErrorRegex,
    `console.log('Profile endpoint returned success but attempting to parse manually');
              try {
                // Final attempt: get the text and try to parse it
                const responseText = await retryResponse.text();
                console.log('Raw profile response in recovery:', responseText);
                
                if (responseText && responseText.trim()) {
                  const userData = JSON.parse(responseText);
                  console.log('Successfully parsed profile data in recovery');
                  setAuthState({
                    isAuthenticated: true,
                    isLoading: false,
                    lastVerified: Date.now(),
                    user: userData,
                    initialCheckDone: true
                  });
                  return;
                }
              } catch (parseError) {
                console.error('Final parse attempt failed:', parseError);
              }`
  );
  
  // Save the enhanced AuthContext.tsx
  console.log('Writing updated AuthContext.tsx...');
  fs.writeFileSync(authContextPath, authContextContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authCorsPath} ${authContextPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Update auth-cors middleware syntax and improve profile data extraction"', { stdio: 'inherit' });
  
  // Push to GitHub
  console.log('Pushing to GitHub...');
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });
    console.log('Successfully pushed to GitHub');
  } catch (error) {
    console.error('Failed to push to GitHub. You may need to push manually.');
    console.error(`Error: ${error.message}`);
  }
  
  // Deploy to Heroku
  console.log('\n=== DEPLOYING TO HEROKU ===\n');
  try {
    execSync(`git push heroku ${branchName}:main -f`, { stdio: 'inherit' });
    console.log('\n=== DEPLOYMENT SUCCESSFUL ===\n');
    console.log('The profile data extraction fix has been deployed to Heroku.');
    console.log('The achievements tab should now correctly retrieve user profile data.');
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
  console.log('2. Sign in and navigate to the achievements tab');
  console.log('3. Open the browser console (F12) to check for profile data retrieval');
  console.log('4. Verify that profile data is now being successfully extracted');
  console.log('5. You should see your badges load properly\n');
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
  process.exit(1);
}
