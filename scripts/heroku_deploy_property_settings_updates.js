const { execSync } = require('child_process');
const path = require('path');

/**
 * Script to deploy property settings updates to Heroku
 * This includes:
 * - Making all property settings fields optional
 * - Removing window settings duplication
 * - Moving all window-related settings to the WindowMaintenanceSection
 */

console.log('Starting property settings updates deployment...');

try {
  // Commit changes
  console.log('Committing changes...');
  execSync('git commit -m "Property settings rework: Optional fields and window settings consolidation"', { stdio: 'inherit' });

  // Push to Heroku
  console.log('Pushing to Heroku...');
  execSync('git push heroku main', { stdio: 'inherit' });

  console.log('\nDeployment complete!');
  console.log('Changes:');
  console.log('- Made all property settings fields optional');
  console.log('- Consolidated window settings in WindowMaintenanceSection');
  console.log('- Updated types to include windowType in WindowMaintenance');
  console.log('- Removed duplicate window fields from PropertyDetailsForm');
  
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}
