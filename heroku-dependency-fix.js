/**
 * heroku-dependency-fix.js
 * 
 * Script to fix Heroku deployment issues with missing dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Print a formatted message
 */
function print(message, color = 'reset', isBright = false) {
  const bright = isBright ? colors.bright : '';
  console.log(`${bright}${colors[color]}${message}${colors.reset}`);
}

/**
 * Execute a command and return output
 */
function runCommand(command) {
  print(`${colors.dim}> ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    print(`Error: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Fix missing dotenv dependency
 */
function fixDotenvDependency() {
  print('\nChecking backend package.json for dotenv...', 'blue', true);
  
  const backendPackageJsonPath = path.join(__dirname, 'backend', 'package.json');
  
  if (!fs.existsSync(backendPackageJsonPath)) {
    print(`Backend package.json not found at ${backendPackageJsonPath}`, 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(backendPackageJsonPath, 'utf8'));
  let modified = false;
  
  // Check if dotenv is already in dependencies
  if (!packageJson.dependencies.dotenv) {
    print('Adding dotenv to backend dependencies', 'yellow');
    packageJson.dependencies.dotenv = "^16.3.1"; // Use a stable version
    modified = true;
  } else {
    print(`dotenv already exists in backend dependencies: ${packageJson.dependencies.dotenv}`, 'green');
  }
  
  // Save changes if needed
  if (modified) {
    fs.writeFileSync(backendPackageJsonPath, JSON.stringify(packageJson, null, 2));
    print('Updated backend package.json with dotenv dependency', 'green', true);
  }
  
  return modified;
}

/**
 * Fix canvas build issues by adding buildpacks
 */
function fixCanvasBuildIssues() {
  print('\nChecking for canvas dependency in backend...', 'blue', true);
  
  const backendPackageJsonPath = path.join(__dirname, 'backend', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(backendPackageJsonPath, 'utf8'));
  
  // Check if canvas is a dependency
  const hasCanvas = packageJson.dependencies.canvas || packageJson.devDependencies?.canvas;
  
  if (hasCanvas) {
    print('Canvas dependency found. This requires buildpacks for compilation.', 'yellow');
    print('\nTo fix canvas build issues, you need to add the following buildpacks to Heroku:', 'cyan');
    print('1. heroku/nodejs', 'cyan');
    print('2. https://github.com/heroku/heroku-buildpack-apt', 'cyan');
    
    print('\nAnd create an Aptfile in the root with these dependencies:', 'cyan');
    
    // Create Aptfile with required dependencies
    const aptfileContent = 
`# Aptfile
libcairo2-dev
libjpeg-dev
libpango1.0-dev
libgif-dev
librsvg2-dev
build-essential
python3`;
    
    const aptfilePath = path.join(__dirname, 'Aptfile');
    fs.writeFileSync(aptfilePath, aptfileContent);
    print('Created Aptfile with required dependencies', 'green');
    
    print('\nTo add these buildpacks to Heroku, run:', 'cyan');
    print('heroku buildpacks:clear -a energy-audit-store', 'dim');
    print('heroku buildpacks:add heroku/nodejs -a energy-audit-store', 'dim');
    print('heroku buildpacks:add https://github.com/heroku/heroku-buildpack-apt -a energy-audit-store', 'dim');
    
    return true;
  } else {
    print('Canvas dependency not found. No buildpack fixes needed.', 'green');
    return false;
  }
}

/**
 * Create a Procfile for Heroku
 */
function createProcfile() {
  print('\nChecking Procfile...', 'blue', true);
  
  const procfilePath = path.join(__dirname, 'Procfile');
  let modified = false;
  
  if (fs.existsSync(procfilePath)) {
    const procfileContent = fs.readFileSync(procfilePath, 'utf8');
    print('Existing Procfile content:', 'cyan');
    console.log(procfileContent);
  } else {
    // Create a new Procfile
    const procfileContent = 'web: cd backend && npm start';
    fs.writeFileSync(procfilePath, procfileContent);
    print('Created new Procfile with content:', 'green');
    console.log(procfileContent);
    modified = true;
  }
  
  return modified;
}

/**
 * Check and update Heroku config
 */
function suggestHerokuConfig() {
  print('\nHeroku Configuration Suggestions:', 'blue', true);
  
  print('1. Make sure NODE_ENV is set to production:', 'cyan');
  print('   heroku config:set NODE_ENV=production -a energy-audit-store', 'dim');
  
  print('\n2. Set the Node.js version in package.json:', 'cyan');
  
  // Update package.json with Node.js engine constraints
  const rootPackageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
  
  if (!packageJson.engines) {
    packageJson.engines = {
      "node": "18.x"
    };
    fs.writeFileSync(rootPackageJsonPath, JSON.stringify(packageJson, null, 2));
    print('   Added Node.js engine constraint to package.json (18.x)', 'green');
  } else {
    print(`   Current engines in package.json: ${JSON.stringify(packageJson.engines)}`, 'yellow');
  }
  
  print('\n3. Set NPM_CONFIG_PRODUCTION to false to install devDependencies:', 'cyan');
  print('   heroku config:set NPM_CONFIG_PRODUCTION=false -a energy-audit-store', 'dim');
}

/**
 * Create or update a deploy script
 */
function createDeployScript() {
  print('\nCreating Heroku deploy script...', 'blue', true);
  
  const deployScriptPath = path.join(__dirname, 'scripts', 'heroku_deploy_dependency_fix.js');
  
  // Ensure scripts directory exists
  if (!fs.existsSync(path.join(__dirname, 'scripts'))) {
    fs.mkdirSync(path.join(__dirname, 'scripts'));
  }
  
  const deployScriptContent = `/**
 * heroku_deploy_dependency_fix.js
 * 
 * Script to deploy fixes for Heroku dependency issues
 */

const { execSync } = require('child_process');

console.log('Starting Heroku dependency fix deployment...');

try {
  // Add files to git
  console.log('\\nAdding files to git...');
  execSync('git add backend/package.json Procfile Aptfile package.json', { stdio: 'inherit' });
  
  // Commit changes
  console.log('\\nCommitting changes...');
  execSync('git commit -m "Fix Heroku dependency issues"', { stdio: 'inherit' });
  
  // Push to Heroku
  console.log('\\nPushing to Heroku...');
  execSync('git push heroku \`git branch --show-current\`:master -f', { stdio: 'inherit' });
  
  console.log('\\nDeployment completed successfully!');
  console.log('Check the app status with: heroku logs -tail -a energy-audit-store');
} catch (error) {
  console.error('\\nDeployment failed:', error.message);
  process.exit(1);
}
`;
  
  fs.writeFileSync(deployScriptPath, deployScriptContent);
  print(`Created deploy script at: ${deployScriptPath}`, 'green');
  
  // Make it executable
  try {
    fs.chmodSync(deployScriptPath, '755');
  } catch (error) {
    // Windows doesn't support chmod, so just ignore this error
  }
  
  return deployScriptPath;
}

/**
 * Main function
 */
function main() {
  print('==============================================', 'blue', true);
  print('         HEROKU DEPENDENCY FIX UTILITY', 'blue', true);
  print('==============================================', 'blue', true);
  print('This script fixes dependency issues for Heroku deployment\n', 'cyan');
  
  let fixesApplied = false;
  
  // Fix dotenv dependency
  const dotenvFixed = fixDotenvDependency();
  if (dotenvFixed) fixesApplied = true;
  
  // Fix canvas build issues with buildpacks
  const canvasFixed = fixCanvasBuildIssues();
  if (canvasFixed) fixesApplied = true;
  
  // Check and update Procfile
  const procfileUpdated = createProcfile();
  if (procfileUpdated) fixesApplied = true;
  
  // Suggest Heroku configuration
  suggestHerokuConfig();
  
  // Create deploy script
  const deployScriptPath = createDeployScript();
  
  // Summary
  print('\n==============================================', 'green', true);
  print('                  SUMMARY', 'green', true);
  print('==============================================', 'green', true);
  
  if (fixesApplied) {
    print('Fixes have been applied to resolve Heroku deployment issues.', 'green');
  } else {
    print('No critical issues found that needed fixing.', 'yellow');
  }
  
  print('\nTo deploy these fixes to Heroku:', 'cyan');
  print('1. Run the deploy script:', 'cyan');
  print(`   node ${deployScriptPath}`, 'dim');
  print('\n2. Or manually push the changes:', 'cyan');
  print('   git add backend/package.json Procfile Aptfile package.json', 'dim');
  print('   git commit -m "Fix Heroku dependency issues"', 'dim');
  print('   git push heroku `git branch --show-current`:master -f', 'dim');
  
  print('\nAfter deployment, check the app status with:', 'cyan');
  print('   heroku logs -tail -a energy-audit-store', 'dim');
}

// Run the script
main();
