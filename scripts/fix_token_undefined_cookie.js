/**
 * Deployment script for fixing token undefined cookie issue
 * 
 * This script implements the fixes detailed in the token-undefined-cookie-fix.md
 * documentation file to address authentication failures on the dashboard caused
 * by undefined tokens being stored as strings in cookies.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Utility function to ensure directory exists
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) return;
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// Utility function to read and write file contents
function updateFile(filePath, transform) {
  console.log(`Updating ${filePath}...`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updated = transform(content);
    fs.writeFileSync(filePath, updated);
    console.log(`✓ Successfully updated ${filePath}`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    process.exit(1);
  }
}

// Create a new branch
console.log('Creating fix branch...');
try {
  execSync('git checkout -b fix/token-undefined-cookie');
  console.log('✓ Branch created');
} catch (error) {
  console.log('Branch may already exist, continuing...');
}

// 1. Update cookieUtils.ts
updateFile('src/utils/cookieUtils.ts', (content) => {
  // Check if setCookie already exists
  if (content.includes('export const setCookie =')) {
    console.log('setCookie already exists, skipping...');
    return content;
  }

  // Check if we need to add cookie import
  const needsCookieImport = !content.includes('from \'cookie\'');
  let newContent = content;

  // Add cookie import if needed
  if (needsCookieImport) {
    newContent = `import { serialize, CookieSerializeOptions } from 'cookie';
${newContent}`;
  }

  // Add setCookie function
  newContent += `
/**
 * Set a cookie with proper serialization and guards against falsy values
 * @param name - Cookie name
 * @param value - Cookie value (will be skipped if falsy)
 * @param opts - Cookie options
 */
export const setCookie = (
  name: string,
  value: string | undefined | null,
  opts: CookieSerializeOptions = {}
) => {
  if (!value) return;  // Skip falsy values (null, undefined, empty string)
  document.cookie = serialize(name, value, {
    path: '/',
    sameSite: 'strict',
    ...opts,
  });
};
`;

  return newContent;
});

// 2. Update apiClient.ts
updateFile('src/services/apiClient.ts', (content) => {
  // Add consecutive401 counter at the top level
  if (!content.includes('let consecutive401 =')) {
    content = content.replace(
      'import axios', 
      'let consecutive401 = 0; // Counter to prevent infinite refresh loops\n\nimport axios'
    );
  }

  // Update request interceptor to include token guard
  content = content.replace(
    /if\s*\(token\)\s*\{\s*config\.headers\.Authorization\s*=\s*`Bearer \$\{token\}`\s*;\s*\}/,
    'if (token) {\n      config.headers.Authorization = `Bearer ${token}`;\n    }'
  );

  // Update response interceptor to include consecutive401 counter logic
  content = content.replace(
    /if\s*\(error\.response\?\.\.status\s*===\s*401\s*&&\s*!originalRequest\._retry\)\s*\{/,
    'if (error.response?.status === 401 && !originalRequest._retry) {\n      originalRequest._retry = true;\n      consecutive401++;\n      \n      // If we\'ve had too many consecutive 401s, redirect to login instead of retrying\n      if (consecutive401 >= 2) {\n        consecutive401 = 0; // Reset counter\n        \n        // Redirect to login\n        if (typeof window !== \'undefined\') {\n          console.log(\'Too many consecutive auth failures, redirecting to login\');\n          localStorage.setItem(\'authRedirect\', window.location.pathname);\n          window.location.href = \'/sign-in\';\n          return Promise.reject(error);\n        }\n      }'
  );

  // Add reset for consecutive401 counter on non-401 responses
  content = content.replace(
    /}\s*else\s*if\s*\(error\.response\?\.\.status\s*>=\s*500\s*&&\s*error\.response\?\.\.status\s*<\s*600\)\s*\{/,
    '} else if (error.response?.status !== 401) {\n      // Reset counter for non-401 errors\n      consecutive401 = 0;\n    }\n\n    // For server errors (5xx), implement retry with exponential backoff\n    if (error.response?.status >= 500 && error.response?.status < 600) {'
  );

  return content;
});

// 3. Update AuthContext.tsx
updateFile('src/context/AuthContext.tsx', (content) => {
  // Add import for setCookie if it doesn't exist
  if (!content.includes('setCookie')) {
    content = content.replace(
      /import\s*\{\s*([^}]*)\}\s*from\s*['"]@\/utils\/cookieUtils['"];?/,
      'import { $1, setCookie } from \'@/utils/cookieUtils\';'
    );
  }

  // Update refreshToken function to set cookies
  content = content.replace(
    /const refreshToken\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?if\s*\(!refreshResponse\.ok\)\s*\{[\s\S]*?\}[\s\S]*?console\.log\('Token refresh successful'\);\s*return true;/,
    `const refreshToken = async () => {
    if (isRefreshing) return false;
    isRefreshing = true;

    try {
      console.log('Attempting token refresh');
      const refreshResponse = await fetchWithRetry(
        API_ENDPOINTS.AUTH.REFRESH,
        {
          method: 'POST',
        }
      );

      if (!refreshResponse.ok) {
        throw new Error('Token refresh failed');
      }
      
      // Parse the response to get the new tokens
      const data = await refreshResponse.json();

      // Update cookies with the new token if present
      if (data?.accessToken) {
        setCookie('accessToken', data.accessToken, { maxAge: 15 * 60 }); // 15 minutes
        localStorage.setItem('accessToken', data.accessToken);
        
        if (data.refreshToken) {
          setCookie('refreshToken', data.refreshToken, { maxAge: 7 * 24 * 60 * 60 }); // 7 days
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        
        console.log('Updated tokens in both cookies and localStorage');
      }

      console.log('Token refresh successful');
      return true;`
  );

  return content;
});

// Install cookie dependency if needed
console.log('Checking for cookie dependency...');
try {
  // Try to resolve the cookie module
  require.resolve('cookie', { paths: [process.cwd()] });
  console.log('✓ Cookie dependency already installed');
} catch (error) {
  console.log('Installing cookie dependency...');
  execSync('npm install cookie @types/cookie --save');
  console.log('✓ Cookie dependency installed');
}

// Commit changes
console.log('Committing changes...');
let gitOutput;
try {
  execSync('git add .');
  gitOutput = execSync('git commit -m "Fix token undefined cookie issue causing dashboard auth errors"').toString();
  console.log('✓ Changes committed');
  console.log(gitOutput);
} catch (error) {
  console.log('Commit failed, but continuing. Error:', error.message);
}

console.log('\n✅ Implementation complete!');
console.log('\nNext steps:');
console.log('1. Test locally: npm run dev');
console.log('2. Push to GitHub: git push origin fix/token-undefined-cookie');
console.log('3. Deploy to Heroku: git push heroku fix/token-undefined-cookie:main');
console.log('\nFor more details, see energy-audit-vault/operations/bug-fixes/token-undefined-cookie-fix.md');
