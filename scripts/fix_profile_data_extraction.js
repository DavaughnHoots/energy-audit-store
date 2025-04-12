/**
 * Fix for profile data extraction issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-profile-data-extraction';

try {
  console.log('\n=== STARTING PROFILE DATA EXTRACTION FIX ===\n');
  
  // Create or checkout deployment branch
  try {
    console.log(`Creating branch ${branchName}...`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
  } catch (error) {
    console.log(`Branch ${branchName} may already exist, trying to check it out...`);
    execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
  }
  
  // Update the backend profile endpoint to ensure proper logging
  // and include more clear error messages
  const authRoutesPath = path.join(currentDir, 'backend', 'src', 'routes', 'auth.ts');
  let authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Update the profile endpoint with improved logging and error handling
  authRoutesContent = authRoutesContent.replace(
    // Find the profile endpoint
    /\/\/\s*Get current user profile[\s\S]*?router\.get\(\'\/profile\',\s*authenticate,\s*async\s*\(req:\s*AuthRequest,\s*res:\s*Response\)\s*=>\s*\{[\s\S]*?try\s*\{[\s\S]*?const userId\s*=\s*req\.user\?\.id;[\s\S]*?if\s*\(!userId\)\s*\{[\s\S]*?return res\.status\(401\)\.json\(\{\s*error:\s*'Authentication required'\s*\}\);[\s\S]*?\}([\s\S]*?)\}\s*catch\s*\(error\)\s*\{/,
    // Update with improved implementation
    // Get current user profile
    `// Get current user profile
    router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;
        console.log('\nProfile request received, user ID from request:', userId);
        console.log('Complete user object from request:', JSON.stringify(req.user));
        
        if (!userId) {
          console.error('No user ID found in authenticated request');
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Set cache control headers to prevent 304 responses
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');$1}
      catch (error) {`
  );
  
  // Replace the database query section with improved error handling and formatting
  authRoutesContent = authRoutesContent.replace(
    /try\s*\{[\s\S]*?const result\s*=\s*await pool\.query\([\s\S]*?'SELECT id, email, full_name, phone, address, role FROM users WHERE id = \$1',[\s\S]*?\[userId\][\s\S]*?\);[\s\S]*?if\s*\(result\.rows\.length\s*===\s*0\)\s*\{[\s\S]*?return res\.status\(404\)\.json\(\{[\s\S]*?error:\s*'User not found',[\s\S]*?message:\s*'The requested user profile could not be found'[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?([\s\S]*?)\}\s*catch\s*\(dbError\)/,
    `try {
          console.log('Executing database query for user profile...');
          const result = await pool.query(
            'SELECT id, email, full_name, phone, address, role FROM users WHERE id = $1',
            [userId]
          );
          
          console.log('Database query completed. Row count:', result.rows.length);
          
          if (result.rows.length === 0) {
            console.error('User not found in database for ID:', userId);
            return res.status(404).json({ 
              error: 'User not found',
              message: 'The requested user profile could not be found'
            });
          }
          
          // Format the user data consistently
          const userData = {
            id: result.rows[0].id,
            email: result.rows[0].email,
            fullName: result.rows[0].full_name,
            phone: result.rows[0].phone || '',
            address: result.rows[0].address || '',
            role: result.rows[0].role || 'user'
          };
          
          // Generate CSRF token when getting profile
          generateCsrfToken(req, res, () => {});

          // Log the response data for debugging
          console.log('Sending profile data:', JSON.stringify(userData));
          
          // Always return a 200 with fresh data
          return res.json(userData);
        } catch (dbError)`
  );
  
  // Update the AuthContext.tsx in the frontend to better handle different data formats
  const authContextPath = path.join(currentDir, 'src', 'context', 'AuthContext.tsx');
  let authContextContent = fs.readFileSync(authContextPath, 'utf8');
  
  // Find the checkAuthStatus function and enhance the data extraction
  authContextContent = authContextContent.replace(
    /const checkAuthStatus\s*=\s*async\s*\(force:\s*boolean\s*=\s*false\)\s*=>\s*\{[\s\S]*?try\s*\{[\s\S]*?const response\s*=\s*await\s*fetchWithRetry\([\s\S]*?if\s*\(!response\.ok\)\s*\{[\s\S]*?\}([\s\S]*?)\/\/\s*Get the raw text first, then parse it[\s\S]*?const responseText\s*=\s*await response\.text\(\);[\s\S]*?console\.log\('Raw profile response:',\s*responseText\);[\s\S]*?if\s*\(responseText\s*&&\s*responseText\.trim\(\)\)\s*\{[\s\S]*?try\s*\{[\s\S]*?const userData\s*=\s*JSON\.parse\(responseText\);[\s\S]*?console\.log\('Profile data:',\s*userData\);[\s\S]*?setAuthState\({[\s\S]*?isAuthenticated:\s*true,[\s\S]*?isLoading:\s*false,[\s\S]*?lastVerified:\s*Date\.now\(\),[\s\S]*?user:\s*userData,[\s\S]*?initialCheckDone:\s*true[\s\S]*?\}\);/,
    `const checkAuthStatus = async (force: boolean = false) => {
      // Prevent check if already in progress
      if (window.checkingAuthStatus) {
        console.log('Auth check already in progress, skipping');
        return;
      }
      
      window.checkingAuthStatus = true;
      
      try {
        const response = await fetchWithRetry(
          API_ENDPOINTS.AUTH.PROFILE,
          {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );

        if (!response.ok) {$1// Get the raw text first, then parse it
        const responseText = await response.text();
        console.log('Raw profile response:', responseText);
        
        if (responseText && responseText.trim()) {
          try {
            // Parse the response text
            const userData = JSON.parse(responseText);
            console.log('Profile data:', userData);
            
            // Ensure we have a valid user object with fallbacks
            const validatedUserData = {
              id: userData.id || userData.userId || null,
              email: userData.email || '',
              fullName: userData.fullName || userData.full_name || '',
              role: userData.role || 'user',
              // Include any other fields you need
            };
            
            // Only proceed with authentication if we have at least id and email
            if (validatedUserData.id && validatedUserData.email) {
              console.log('Valid user data extracted:', validatedUserData);
              
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                lastVerified: Date.now(),
                user: validatedUserData,
                initialCheckDone: true
              });
            } else {
              console.error('User data missing required fields:', validatedUserData);
              throw new Error('Invalid user data structure');
            }`
  );
  
  // Update the error handling to be more explicit
  authContextContent = authContextContent.replace(
    /\} catch \(parseError\) \{[\s\S]*?console\.error\('Error parsing profile JSON:', parseError\);[\s\S]*?throw new Error\('Failed to parse profile data'\);[\s\S]*?\}[\s\S]*?\} else \{[\s\S]*?console\.warn\('Empty profile response'\);[\s\S]*?throw new Error\('Empty profile response'\);/,
    `} catch (parseError) {
              console.error('Error parsing profile JSON:', parseError);
              console.error('Raw response that failed parsing:', responseText);
              throw new Error('Failed to parse profile data');
            }
          } else {
            console.warn('Empty profile response');
            throw new Error('Empty profile response');
          }`
  );
  
  // Add logic at the end of the checkAuthStatus function to reset the lock
  authContextContent = authContextContent.replace(
    /\} catch \(error\) \{[\s\S]*?console\.error\('Auth check failed:', error\);[\s\S]*?setAuthState\(\{[\s\S]*?isAuthenticated:\s*false,[\s\S]*?isLoading:\s*false,[\s\S]*?lastVerified:\s*Date\.now\(\),[\s\S]*?user:\s*null,[\s\S]*?initialCheckDone:\s*true[\s\S]*?\}\);[\s\S]*?\}/,
    `} catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          lastVerified: Date.now(),
          user: null,
          initialCheckDone: true
        });
      } finally {
        // Release the lock
        window.checkingAuthStatus = false;
      }`
  );

  // Also add the typescript declaration for the global window property
  authContextContent = authContextContent.replace(
    /import React, \{ createContext, useContext, useState, useEffect(.*) \} from 'react';/,
    `import React, { createContext, useContext, useState, useEffect$1 } from 'react';

// Add global window property for auth check locking
declare global {
  interface Window {
    checkingAuthStatus?: boolean;
    authCheckCounter?: number;
  }
}`
  );
  
  // Save the updated files
  console.log('Writing updated auth.ts...');
  fs.writeFileSync(authRoutesPath, authRoutesContent);
  
  console.log('Writing updated AuthContext.tsx...');
  fs.writeFileSync(authContextPath, authContextContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authRoutesPath} ${authContextPath}`, { stdio: 'inherit' });
  
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Fix: Improve profile data extraction and error handling"', { stdio: 'inherit' });
  
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
    console.log('Profile data extraction fix has been deployed to Heroku.');
    console.log('The authentication process should now work correctly.');
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
  console.log('2. Clear the browser cache and cookies for the site (or use Incognito/Private browsing)');
  console.log('3. Sign in and verify that you can see the dashboard and achievements tab');
  console.log('4. Check browser console logs for profile data extraction success messages\n');
  
} catch (error) {
  console.error('\n=== DEPLOYMENT FAILED ===\n');
  console.error('An error occurred during deployment:');
  console.error(error.message);
  process.exit(1);
}
