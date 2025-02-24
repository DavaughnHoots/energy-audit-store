import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the src directory path
const srcDir = path.join(__dirname, '..');

// Function to check if a path is a relative import
const isRelativeImport = (importPath) => {
  return importPath.startsWith('.') && !importPath.endsWith('.js');
};

// Function to process a single file
const processFile = (filePath) => {
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Regular expression to match import statements
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  
  // Replace imports without .js with .js extension
  content = content.replace(importRegex, (match, importPath) => {
    if (isRelativeImport(importPath)) {
      modified = true;
      return `from '${importPath}.js'`;
    }
    return match;
  });

  // Save the file if it was modified
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated imports in ${filePath}`);
  }
};

// Function to recursively process all TypeScript files in a directory
const processDirectory = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      processFile(fullPath);
    }
  }
};

// Start processing from the src directory
console.log('Starting to process TypeScript files...');
processDirectory(srcDir);
console.log('Finished processing TypeScript files.');
