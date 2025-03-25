#!/usr/bin/env node

/**
 * Script to fix ES Module compatibility issues in PostgreSQL imports
 * Changes 'import { Pool } from 'pg'' to 'import pkg from 'pg'; const { Pool } = pkg;'
 */

const fs = require('fs');
const path = require('path');

// Files that need to be checked for pg imports
const targetFiles = [
  'backend/src/utils/db.ts',
  'backend/src/services/educationService.ts',
  'backend/src/services/efficiencyScoreService.ts',
  'backend/src/services/ReportGenerationService.ts'
];

// Function to fix imports in a file
function fixImports(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it has problematic pg import
    if (content.includes('import { Pool } from \'pg\'')) {
      console.log(`- Found problematic import in ${filePath}`);
      
      // Replace the import
      const updatedContent = content.replace(
        'import { Pool } from \'pg\';',
        'import pkg from \'pg\';\nconst { Pool } = pkg;'
      );
      
      // Write the updated content back
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`- Fixed ES module import in ${filePath}`);
      return true;
    } else {
      console.log(`- No problematic imports found in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('=== Starting ES Module Import Fix ===');
let fixedCount = 0;

for (const file of targetFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    const fixed = fixImports(fullPath);
    if (fixed) fixedCount++;
  } else {
    console.log(`File not found: ${fullPath}`);
  }
}

console.log(`\n=== ES Module Import Fix Complete ===`);
console.log(`Fixed ${fixedCount} files`);
console.log('\nNext steps:');
console.log('1. Commit these changes with: git add . && git commit -m "Fix ES module compatibility for pg imports"');
console.log('2. Deploy with: .\\heroku-direct-sql.bat');
console.log('3. Verify database tables were created successfully');
