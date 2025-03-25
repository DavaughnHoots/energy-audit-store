/**
 * Script to fix PostgreSQL import issues across the entire codebase
 * Changes 'import { Pool } from "pg"' to 'import pkg from "pg"; const { Pool } = pkg;'
 */

const fs = require('fs');
const path = require('path');

// Files with pg import issues based on scan
const filesToFix = [
  'backend/src/routes/energyAudit.ts',
  'backend/src/scripts/heroku_product_preferences_migration.ts',
  'backend/src/scripts/run_audit_migration.ts',
  'backend/src/scripts/run_auth_migration.ts',
  'backend/src/scripts/run_dashboard_migration.ts',
  'backend/src/scripts/run_education_migration.js',
  'backend/src/scripts/run_product_preferences_migration.ts',
  'backend/src/scripts/run_visualization_migration.ts',
  'backend/src/scripts/test_db_connection.ts',
  'backend/src/scripts/verify_db_structure.ts',
  'backend/src/services/analyticsService.ts',
  'backend/src/services/auth/AuthService.ts',
  'backend/src/services/auth/PasswordResetService.ts',
  'backend/src/services/auth/SignUpService.ts',
  'backend/src/services/EnergyAuditService.ts',
  'backend/src/services/notificationsService.ts',
  'backend/src/services/propertySettingsService.ts',
  'backend/src/services/searchService.ts',
  'backend/src/services/userAuthService.ts',
  'backend/src/services/userService.ts',
  'backend/src/services/userSettingsService.ts'
];

// Function to fix an individual file
function fixImportInFile(filePath) {
  try {
    console.log(`Processing ${filePath}...`);
    
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it contains the problematic import pattern
    if (content.includes('import { Pool } from \'pg\'') || content.includes('import { Pool } from "pg"')) {
      // Replace both single-quote and double-quote variants
      let updatedContent = content.replace(
        /import\s*{\s*Pool\s*}\s*from\s*['"]pg['"]/g, 
        'import pkg from \'pg\';\nconst { Pool } = pkg'
      );
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Fixed ES module import in ${filePath}`);
      return true;
    } else {
      console.log(`❌ No pg import issues found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function to fix all files
async function main() {
  console.log('=== Starting PostgreSQL Import Fix ===');
  console.log(`Found ${filesToFix.length} files with potential import issues`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const file of filesToFix) {
    try {
      const fullPath = path.resolve(process.cwd(), file);
      
      if (fs.existsSync(fullPath)) {
        const result = fixImportInFile(fullPath);
        if (result) {
          successCount++;
        }
      } else {
        console.error(`❌ File not found: ${fullPath}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing file ${file}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('');
  console.log(`=== Import Fix Complete: ${successCount} fixed, ${errorCount} errors ===`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Git add and commit the changes');
  console.log('2. Build and deploy your application');
}

// Run the script
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});
