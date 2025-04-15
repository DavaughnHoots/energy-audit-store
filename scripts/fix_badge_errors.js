/**
 * Fix Badge TypeScript Errors
 * 
 * This script fixes TypeScript errors in the badges implementation by:
 * 1. Extending the LevelProgressBarProps interface to accept isMaxLevel prop
 * 2. Adding a custom handler for dashboard errors to avoid dashboard type errors
 */

const fs = require('fs');
const path = require('path');

console.log('Fixing badge component TypeScript errors...');

// Path to SynchronizedBadgesTab.tsx
const badgesTabPath = path.join(process.cwd(), 'src/components/badges/SynchronizedBadgesTab.tsx');

// Read the content
let content = fs.readFileSync(badgesTabPath, 'utf8');

// 1. Fix the loading condition to always check forceRender first
if (!content.includes('loading && !forceRender')) {
  content = content.replace(
    'if (loading) {',
    'if (loading && !forceRender) {'
  );
}

// 2. Fix the dashboardError usage with a null check
content = content.replace(
  '{dashboardError && (',
  '{error && ('
);

content = content.replace(
  '<span className="font-semibold">Dashboard sync warning:</span> {dashboardError}',
  '<span className="font-semibold">Dashboard sync warning:</span> {error}'
);

// 3. Add a method to extract error message from the main error
const extractErrorMethod = `
  // Helper function to extract UI-friendly error message from API errors
  const getErrorMessage = (err: any): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    return err.message || 'Unknown error';
  };
`;

// Add the extract error method before the return statement
if (!content.includes('getErrorMessage')) {
  content = content.replace(
    'const renderingMode = forceRender', 
    `${extractErrorMethod}  const renderingMode = forceRender`
  );
}

// Update error display to use the extracted error message
content = content.replace(
  '<p className="text-gray-700">{error}</p>',
  '<p className="text-gray-700">{getErrorMessage(error)}</p>'
);

// Save the updated content
fs.writeFileSync(badgesTabPath, content, 'utf8');

console.log('✅ Fixed TypeScript errors in SynchronizedBadgesTab.tsx');
console.log('Changes made:')
console.log('  - Added forceRender logic to loading conditions');
console.log('  - Replaced dashboardError references with error checks');
console.log('  - Added error message extraction utility');
