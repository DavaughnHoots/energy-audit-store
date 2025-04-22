/**
 * Fix script for Product Estimation System deployment issue
 * 
 * This script addresses the build failure with the zod dependency:
 * "Rollup failed to resolve import 'zod' from src/schemas/productEstimationSchema.ts"
 * 
 * It ensures the zod package is properly installed and adds it to package.json if needed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to check if zod is in package.json
function checkZodDependency() {
  console.log('Checking zod dependency in package.json...');
  
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found!');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check if zod is in dependencies or devDependencies
  const hasZod = (
    (packageJson.dependencies && packageJson.dependencies.zod) ||
    (packageJson.devDependencies && packageJson.devDependencies.zod)
  );
  
  if (hasZod) {
    console.log('✅ zod dependency found in package.json');
    return true;
  } else {
    console.log('❌ zod dependency not found in package.json');
    return false;
  }
}

// Function to add zod to package.json
function addZodDependency() {
  console.log('Adding zod dependency to package.json...');
  
  try {
    // Add zod using npm
    execSync('npm install zod --save', { stdio: 'inherit' });
    console.log('✅ zod dependency added successfully!');
    return true;
  } catch (error) {
    console.error('Error adding zod dependency:', error.message);
    return false;
  }
}

// Function to create vite config override
function updateViteConfig() {
  console.log('Updating vite.config.ts to handle zod as external...');
  
  const viteConfigPath = 'vite.config.ts';
  
  if (!fs.existsSync(viteConfigPath)) {
    console.error('Error: vite.config.ts not found!');
    process.exit(1);
  }
  
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Check if config already has external rollup options
  if (viteConfig.includes('external: [')) {
    // Already has external config, let's add zod if not already there
    if (!viteConfig.includes("'zod'") && !viteConfig.includes('"zod"')) {
      viteConfig = viteConfig.replace(
        /external:\s*\[([^\]]*)\]/,
        (match, group) => {
          // Check if there are already items in the array
          if (group.trim() === '') {
            return `external: ['zod']`;
          } else {
            return `external: [${group}, 'zod']`;
          }
        }
      );
    } else {
      console.log('✅ vite.config.ts already includes zod as external');
      return true;
    }
  } else {
    // Need to add the rollup options with external
    // Find the defineConfig call
    if (viteConfig.includes('export default defineConfig(')) {
      viteConfig = viteConfig.replace(
        /export default defineConfig\(\{([^}]*)\}\)/s,
        (match, group) => {
          if (group.includes('build:')) {
            // build section exists, add rollupOptions to it
            return viteConfig.replace(
              /build:\s*\{([^}]*)\}/s,
              (buildMatch, buildGroup) => {
                if (buildGroup.includes('rollupOptions:')) {
                  // rollupOptions already exists, unlikely but handle it
                  return buildMatch;
                } else {
                  // Add rollupOptions to build
                  return `build: {${buildGroup}, rollupOptions: { external: ['zod'] }}`;
                }
              }
            );
          } else {
            // No build section, add it
            return `export default defineConfig({
  ${group},
  build: {
    rollupOptions: {
      external: ['zod']
    }
  }
})`;
          }
        }
      );
    } else {
      // Unusual format, append new config
      viteConfig += `\n\n// Added by fix script for zod dependency\nexport const rollupOptions = {\n  external: ['zod']\n};\n`;
    }
  }
  
  // Write the updated config
  fs.writeFileSync(viteConfigPath, viteConfig, 'utf8');
  console.log('✅ vite.config.ts updated to handle zod dependency');
  return true;
}

// Create script to manually update package.json if needed
function createUpdateScript() {
  console.log('Creating manual update script...');
  
  const updateScriptPath = 'scripts/manual_add_zod_dependency.js';
  const scriptContent = `/**
 * Manual script to add zod dependency to package.json
 * Run this if you encounter issues with the automated process
 */

const fs = require('fs');

// Load package.json
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Ensure dependencies exists
if (!packageJson.dependencies) {
  packageJson.dependencies = {};
}

// Add zod dependency
packageJson.dependencies.zod = '^3.22.4';

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

console.log('Successfully added zod dependency to package.json');
console.log('Now run: npm install && git add package.json package-lock.json && git commit -m "Add zod dependency"');
`;

  // Create the directory if it doesn't exist
  const dir = path.dirname(updateScriptPath);
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(updateScriptPath, scriptContent, 'utf8');
  console.log(`✅ Created manual update script: ${updateScriptPath}`);
}

// Function to create a new commit with the changes
function commitChanges() {
  console.log('Committing changes...');
  
  try {
    // Add relevant files
    execSync('git add package.json package-lock.json vite.config.ts');
    
    // Commit with descriptive message
    execSync('git commit -m "Fix zod dependency for product estimation system"');
    
    console.log('✅ Changes committed successfully!');
    return true;
  } catch (error) {
    console.error('Error committing changes:', error.message);
    console.log('You may need to manually commit the changes:');
    console.log('git add package.json package-lock.json vite.config.ts');
    console.log('git commit -m "Fix zod dependency for product estimation system"');
    return false;
  }
}

// Main function
function main() {
  console.log('Starting fix for Product Estimation System deployment issue...');
  console.log('This script will resolve the zod dependency issue.');
  console.log('');
  
  const hasZod = checkZodDependency();
  
  if (!hasZod) {
    console.log('\nAdding zod dependency...');
    const zodAdded = addZodDependency();
    
    if (!zodAdded) {
      console.log('\nCreating manual script as fallback...');
      createUpdateScript();
      console.log('\nPlease run the manual script if needed: node scripts/manual_add_zod_dependency.js');
    }
  }
  
  console.log('\nUpdating Vite configuration...');
  updateViteConfig();
  
  console.log('\nCommitting changes...');
  const committed = commitChanges();
  
  console.log('\nNext steps:');
  if (committed) {
    console.log('1. Deploy to Heroku with: git push heroku HEAD:main');
  } else {
    console.log('1. Manual commit changes if needed');
    console.log('2. Deploy to Heroku with: git push heroku HEAD:main');
  }
  
  console.log('\n✅ Fix process completed! The zod dependency issue should be resolved.');
}

// Execute the main function
main();
