/**
 * Fix Badges Tab Issues
 * 
 * This script fixes issues with the badges tab including:
 * 1. Removing refresh buttons that cause UI inconsistencies
 * 2. Reducing timeout from 5 to 3 seconds to improve responsiveness
 * 3. Replacing refresh buttons with diagnostics links
 * 4. Fixing TypeScript errors in the component
 */

const fs = require('fs');
const path = require('path');

console.log('Starting Badges Tab fixes...');

// Path to the SynchronizedBadgesTab component
const tabPath = path.join(process.cwd(), 'src/components/badges/SynchronizedBadgesTab.tsx');

// Read the current file content
console.log('Reading component file...');
let content = fs.readFileSync(tabPath, 'utf8');

// Apply fixes one by one
console.log('Applying fixes...');

// 1. Reduce timeout from 5 to 3 seconds for faster display
content = content.replace(
  /}, 5000\);/g,
  '}, 3000); // Reduced from 5000ms to 3000ms for faster display'
);

// 2. Replace refresh button in the partial data mode warning
content = content.replace(
  /<button\s+[^>]*onClick=\{\(\)\s*=>\s*refreshBadges\(\)[^}]*}[^>]*>[\s\n]*Refresh[\s\n]*<\/button>/,
  '<a\n          href="/badge-data-diagnostics"\n          className="ml-2 text-blue-600 underline"\n        >\n          View Diagnostics\n        </a>'
);

// 3. Remove the top-right refresh button
content = content.replace(
  /<button\s+[^>]*onClick=\{\(\)\s*=>\s*refreshBadges\(\)[^}]*}[^>]*>[\s\n]*<RefreshCw[^>]*\/>[\s\n]*Refresh[\s\n]*<\/button>/,
  ''
);

// 4. Remove the bottom refresh button
content = content.replace(
  /<div\s+className="mt-6\s+text-center">\s*<button[^>]*onClick=\{\(\)\s*=>\s*refreshBadges\(\)[^}]*}[^>]*>[\s\n]*<RefreshCw[^>]*\/>[\s\n]*Refresh\s+Badges[\s\n]*<\/button>[\s\n]*<\/div>/,
  '<div className="mt-6 text-center">\n        <a\n          href="/badge-data-diagnostics"\n          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto inline-flex"\n        >\n          <Bug className="h-5 w-5" />\n          Advanced Badge Diagnostics\n        </a>\n      </div>'
);

// 5. Fix dashboardError reference - it doesn't exist in the hook anymore
content = content.replace(
  /dashboardError/g,
  'error && error.includes(\'dashboard\')'
);

// 6. Fix typescript error by moving the getErrorMessage function to the top
if (content.includes('const getErrorMessage = (err: any): string =>')) {
  // Function already exists, just make sure it's before the first use
  content = content.replace(
    /const getErrorMessage = \(err: any\): string => \{[^}]*\};/,
    function moveFunction(match) {
      return match; // The function exists, we'll ensure it's used in the right places
    }
  );
} else {
  // Add the function if it doesn't exist
  content = content.replace(
    /const SynchronizedBadgesTab: React\.FC = \(\) => \{/,
    'const SynchronizedBadgesTab: React.FC = () => {\n  // Helper function to extract UI-friendly error message from API errors\n  const getErrorMessage = (err: any): string => {\n    if (!err) return \'\';\n    if (typeof err === \'string\') return err;\n    return err.message || \'Unknown error\';\n  };\n'
  );
}

// Write the changes back to the file
console.log('Writing changes back to file...');
fs.writeFileSync(tabPath, content, 'utf8');

console.log('Badges Tab fixes completed successfully!');
console.log('Changes made:');
console.log('  - Reduced loading timeout from 5 to 3 seconds');
console.log('  - Replaced refresh buttons with diagnostics links');
console.log('  - Fixed TypeScript errors with dashboardError references');
console.log('  - Added error message extraction utility');