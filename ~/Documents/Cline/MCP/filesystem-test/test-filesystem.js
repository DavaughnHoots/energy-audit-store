// Simple test script to demonstrate filesystem MCP server functionality
const path = require('path');
const fs = require('fs');

// Log current directory
console.log('Current working directory:', process.cwd());

// Create a test directory
const testDir = path.join(__dirname, 'test-dir');
try {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
    console.log(`Created directory: ${testDir}`);
  } else {
    console.log(`Directory already exists: ${testDir}`);
  }
} catch (err) {
  console.error('Error creating directory:', err);
}

// Create a test file
const testFile = path.join(testDir, 'test-file.txt');
try {
  fs.writeFileSync(testFile, 'This is a test file created by the filesystem test script.\n');
  console.log(`Created file: ${testFile}`);
} catch (err) {
  console.error('Error creating file:', err);
}

// Read the file contents
try {
  const content = fs.readFileSync(testFile, 'utf8');
  console.log(`File contents: ${content}`);
} catch (err) {
  console.error('Error reading file:', err);
}

// List files in the directory
try {
  const files = fs.readdirSync(testDir);
  console.log(`Files in ${testDir}:`, files);
} catch (err) {
  console.error('Error listing files:', err);
}

console.log('Filesystem test completed successfully!');
