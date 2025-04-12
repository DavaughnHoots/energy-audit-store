/**
 * Fix for profile data extraction issues with manual file edits
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Current directory where script is running
const currentDir = process.cwd();

// Branch name for this deployment
const branchName = 'fix-profile-data-extraction-v2';

try {
  console.log('\n=== STARTING PROFILE DATA EXTRACTION FIX V2 ===\n');
  
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
  const authRoutesContent = fs.readFileSync(authRoutesPath, 'utf8');
  
  // Update the profile endpoint with improved logging and error handling
  const updatedAuthRoutesContent = authRoutesContent.replace(
    // Find the profile endpoint
    /\/\/\s*Get current user profile[\s\S]*?router\.get\(\'\/profile\',\s*authenticate,\s*async\s*\(req:\s*AuthRequest,\s*res:\s*Response\)\s*=>\s*\{[\s\S]*?try\s*\{[\s\S]*?const userId\s*=\s*req\.user\?\.id;[\s\S]*?if\s*\(!userId\)\s*\{[\s\S]*?return res\.status\(401\)\.json\(\{\s*error:\s*'Authentication required'\s*\}\);[\s\S]*?\}/,
    // Update with improved implementation
    `// Get current user profile
    router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
      try {
        const userId = req.user?.id;
        console.log('\nProfile request received, user ID from request:', userId);
        console.log('Complete user object from request:', JSON.stringify(req.user));
        
        if (!userId) {
          console.error('No user ID found in authenticated request');
          return res.status(401).json({ error: 'Authentication required' });
        }`
  );
  
  // Enhanced database query and response handling
  const finalAuthRoutesContent = updatedAuthRoutesContent.replace(
    /try\s*\{[\s\S]*?const result\s*=\s*await pool\.query\([\s\S]*?'SELECT id, email, full_name, phone, address, role FROM users WHERE id = \$1',[\s\S]*?\[userId\][\s\S]*?\);[\s\S]*?if\s*\(result\.rows\.length\s*===\s*0\)\s*\{[\s\S]*?return res\.status\(404\)\.json\(\{[\s\S]*?error:\s*'User not found',[\s\S]*?message:\s*'The requested user profile could not be found'[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?generateCsrfToken\(req,\s*res,\s*\(\)\s*=>\s*\{\}\);[\s\S]*?console\.log\('Sending profile data:',[\s\S]*?JSON\.stringify\(result\.rows\[0\]\)\);[\s\S]*?res\.json\(result\.rows\[0\]\);/,
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
          
          // Set cache control headers to prevent 304 responses
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
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
          return res.json(userData);`
  );
  
  // Save the AUTH ROUTES file
  console.log('Writing updated auth.ts...');
  fs.writeFileSync(authRoutesPath, finalAuthRoutesContent);
  
  // Stage the modified files
  console.log('Staging modified files...');
  execSync(`git add ${authRoutesPath}`, { stdio: 'inherit' });
  
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
