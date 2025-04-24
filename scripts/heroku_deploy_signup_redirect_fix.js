/**
 * Deployment script for signup redirection fix
 * This script deploys the modification that redirects users to energy audit page after signup
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting signup redirection fix deployment...');

const filePath = path.join(__dirname, '../src/components/auth/SignUp.tsx');

try {
  // Read the current file content
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Replace the redirect to verification page with conditional redirect to energy audit
  const updatedContent = fileContent.replace(
    /\/\/ Redirect to verification page\s*\n\s*window\.location\.href = '\/verify-email';/,
    `// Redirect to energy audit page
      if (auditId) {
        window.location.href = \`/energy-audit/\${auditId}/report\`;
      } else {
        window.location.href = '/energy-audit';`
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, updatedContent);
  
  console.log('Successfully updated SignUp.tsx with new redirection logic');
  
  // Add the file to git
  execSync('git add ' + filePath);
  console.log('Added modified file to git');
  
  // Commit the changes
  execSync('git commit -m "Update signup flow to redirect to energy audit page"');
  console.log('Committed changes to git');
  
  // Push to Heroku
  console.log('Deploying to Heroku...');
  execSync('git push heroku master');
  
  console.log('Signup redirection fix successfully deployed!✅');
  console.log('Users will now be redirected to the energy audit page after signup.');
  
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}
