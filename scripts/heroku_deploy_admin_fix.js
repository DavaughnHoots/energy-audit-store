/**
 * Script to deploy the enhanced admin dashboard fix to Heroku
 * This script copies the enhanced files to the build directory
 * so they can be deployed to Heroku
 */

// Required for Node.js file operations
const fs = require('fs');
const path = require('path');

console.log('Deploying admin dashboard fixes to Heroku...');

// Paths to source files
const sourcePaths = [
  { src: 'backend/src/services/AnalyticsService.enhanced.ts', dest: 'backend/build/services/AnalyticsService.enhanced.js' },
  { src: 'backend/src/routes/admin.enhanced.ts', dest: 'backend/build/routes/admin.enhanced.js' }
];

// Compile TypeScript to JavaScript (simplified version - just replacing .ts with .js)
const compileTs = (content) => {
  // Remove TypeScript type annotations
  content = content.replace(/interface\s+\w+\s*{[\s\S]*?}/g, '');
  content = content.replace(/:\s*\w+(\[\])?(\s*\|\s*\w+(\[\])?)*(\s*=\s*[^;,]+)?/g, '');
  content = content.replace(/[<>][\w\s,]+[<>]/g, '');
  content = content.replace(/\?:/g, ':');
  content = content.replace(/\s*as\s+\w+/g, '');
  
  // Replace imports for built JS files
  content = content.replace(/from\s+['"](.*?)\.ts['"]/g, "from '$1.js'");
  
  return content;
};

// Copy and "compile" files
for (const pathObj of sourcePaths) {
  try {
    console.log(`Processing ${pathObj.src} -> ${pathObj.dest}`);
    
    // Read the source file
    let content = fs.readFileSync(pathObj.src, 'utf8');
    
    // Transform content (simplified version of compilation)
    content = compileTs(content);
    
    // Ensure the destination directory exists
    const destDir = path.dirname(pathObj.dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Write the file
    fs.writeFileSync(pathObj.dest, content);
    console.log(`Successfully processed ${pathObj.src}`);
  } catch (error) {
    console.error(`Error processing ${pathObj.src}:`, error);
  }
}

// Copy modified server.ts to build directory with minimal changes
try {
  console.log('Processing enhanced server...');
  
  // Read original server.js from build directory if it exists
  let originalServerPath = 'backend/build/server.js';
  if (!fs.existsSync(originalServerPath)) {
    console.error('Original server.js not found in build directory. Continuing anyway.');
  }
  
  // Read the enhanced server file
  let serverContent = fs.readFileSync('backend/src/server.enhanced.ts', 'utf8');
  
  // Transform content (simplified)
  serverContent = compileTs(serverContent);
  
  // Replace the original server import with the enhanced one
  serverContent = serverContent.replace(
    "import adminRoutes from './routes/admin.js';", 
    "import adminRoutes from './routes/admin.enhanced.js';"
  );
  
  // Write the new server file
  fs.writeFileSync('backend/build/server.js', serverContent);
  console.log('Successfully processed enhanced server');
} catch (error) {
  console.error('Error processing enhanced server:', error);
}

console.log('Admin dashboard fixes deployed. You can now git commit and push to Heroku.');
console.log('Don\'t forget to log out and log back in to refresh your JWT token after deployment.');
