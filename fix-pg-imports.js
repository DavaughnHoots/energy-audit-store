// Script to fix pg module imports across the codebase
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files that import Pool from 'pg'
const filePaths = execSync(
  'powershell -Command "Get-ChildItem -Path backend/src -Recurse -Filter *.ts | Select-String -Pattern \'import.*Pool.*from \'\'pg\'\'\' | Select-Object Path -Unique | ForEach-Object { $_.Path }"',
  { encoding: 'utf8' }
).split('\n').filter(path => path.trim());

// The replacement pattern
const searchRegex = /import\s*{\s*Pool\s*}\s*from\s*['"]pg['"]/;
const replacement = `import pkg from 'pg';\nconst { Pool } = pkg;`;

// Keep track of statistics
let modified = 0;
let skipped = 0;
let errors = 0;

console.log(`Found ${filePaths.length} files to process`);

filePaths.forEach(filePath => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`Skipping non-existent path: ${filePath}`);
      skipped++;
      return;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already fixed
    if (fileContent.includes("import pkg from 'pg'")) {
      console.log(`Skipping already fixed file: ${filePath}`);
      skipped++;
      return;
    }
    
    // Replace the import statement
    const updatedContent = fileContent.replace(searchRegex, replacement);
    
    if (updatedContent !== fileContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated: ${filePath}`);
      modified++;
    } else {
      console.log(`No changes needed for: ${filePath}`);
      skipped++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    errors++;
  }
});

console.log(`\nSummary:`);
console.log(`- ${modified} files modified`);
console.log(`- ${skipped} files skipped`);
console.log(`- ${errors} errors encountered`);
