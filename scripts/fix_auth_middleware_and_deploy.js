/**
 * fix_auth_middleware_and_deploy.js
 * 
 * This script:
 * 1. Fixes the auth middleware to handle invalid headers and OPTIONS requests
 * 2. Builds the project
 * 3. Commits changes
 * 4. Deploys to Heroku
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Updated auth middleware code
const authMiddlewareCode = `// backend/src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { UserAuthService, AuthError } from '../services/userAuthService.js';
import { AuthenticatedRequest, User } from '../types/auth.js';

// Version identifier for logging
const AUTH_MIDDLEWARE_VERSION = 'v1.2';

const authService = new UserAuthService(pool);

// Constants for token refresh
const REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds

// Cookie settings
const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  path: '/',
  domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
};

/**
 * Robustly extracts an access token from either
 *   – Authorization header (\`Bearer <token>\`)
 *   – \`accessToken\` cookie (fallback)
 */
function getAccessToken(req: Request): string | null {
  const rawHeader = req.headers.authorization?.trim();
  console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Raw Auth Header: "\${rawHeader || 'undefined'}"\`);
  
  // Only accept Bearer token if it has a non-empty token part
  if (rawHeader?.toLowerCase().startsWith('bearer ') && rawHeader.length > 7) {
    const token = rawHeader.slice(7).trim();
    if (token && token.length > 0) {
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Token extracted from header (first 10 chars): \${token.substring(0, 10)}...\`);
      return token;
    }
    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Bearer header had empty token\`);
  } else {
    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Auth header not in Bearer format or missing\`);
  }
  
  // Fallback to cookie if header gave nothing
  if (req.cookies?.accessToken && req.cookies.accessToken !== 'undefined') {
    const cookieToken = req.cookies.accessToken;
    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Using token from cookie (first 10 chars): \${cookieToken.substring(0, 10)}...\`);
    return cookieToken;
  }
  
  console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] No valid token found in header or cookie\`);
  return null;
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip auth for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Skipping auth for OPTIONS request\`);
      return next();
    }
    
    // Check if route requires authentication
    const publicRoutes = ['/api/products', '/api/recommendations'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    // Log authentication attempt for debugging
    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Authentication attempt for path: \${req.path}\`);
    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Cookies:\`, req.cookies);
    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Headers:\`, {
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      'content-type': req.headers['content-type'],
      host: req.headers.host
    });

    // Try to get token from header or cookie
    const accessToken = getAccessToken(req);
    const refreshToken = req.cookies?.refreshToken;

    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Access Token: \${accessToken ? 'Present' : 'Missing'}\`);
    console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Refresh Token: \${refreshToken ? 'Present' : 'Missing'}\`);

    if (!accessToken) {
      if (isPublicRoute) {
        console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Public route, proceeding without auth\`);
        return next(); // Allow access to public routes without authentication
      }
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] No access token found\`);
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Verify access token
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Verifying access token...\`);
      const decoded = await authService.verifyToken(accessToken);
      if (decoded) {
        console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Token verified successfully for user: \${decoded.userId}\`);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };

        // Check if token is close to expiring
        const tokenExp = decoded.exp ? decoded.exp * 1000 : 0;
        if (tokenExp - Date.now() < REFRESH_THRESHOLD && refreshToken) {
          console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Token near expiry, attempting refresh\`);
          try {
            // Attempt to refresh tokens
            const { token: newAccessToken, refreshToken: newRefreshToken } =
              await authService.refreshToken(refreshToken);

            // Set new cookies
            res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
            res.cookie('refreshToken', newRefreshToken, COOKIE_CONFIG);
            
            console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Tokens refreshed successfully\`);
          } catch (refreshError) {
            // Log refresh error but continue with current token
            console.error(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Token refresh failed:\`, refreshError);
          }
        }
      }

      next();
    } catch (error) {
      console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Token verification failed:\`, error);
      if (error instanceof AuthError) {
        if (refreshToken) {
          console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Attempting token refresh after verification failure\`);
          try {
            // Attempt to refresh tokens
            const { token: newAccessToken, refreshToken: newRefreshToken } =
              await authService.refreshToken(refreshToken);

            // Set new cookies
            res.cookie('accessToken', newAccessToken, COOKIE_CONFIG);
            res.cookie('refreshToken', newRefreshToken, COOKIE_CONFIG);

            // Verify new access token
            const decoded = await authService.verifyToken(newAccessToken);
            if (decoded) {
              req.user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role
              };
              console.log(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Token refresh and verification successful\`);
            }

            return next();
          } catch (refreshError) {
            console.error(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Token refresh failed:\`, refreshError);
            // Clear cookies if refresh fails
            res.clearCookie('accessToken', COOKIE_CONFIG);
            res.clearCookie('refreshToken', COOKIE_CONFIG);
            return res.status(401).json({ error: 'Session expired' });
          }
        }
        return res.status(401).json({ error: error.message });
      }
      return next(error); // Pass error to Express error handler
    }
  } catch (error) {
    console.error(\`[AUTH-FIX-\${AUTH_MIDDLEWARE_VERSION}] Authentication error:\`, error);
    res.clearCookie('accessToken', COOKIE_CONFIG);
    res.clearCookie('refreshToken', COOKIE_CONFIG);
    return next(error); // Pass error to Express error handler
  }
};

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// CSRF protection
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip CSRF check for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];

  if (!token || !headerToken || token !== headerToken) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token'
    });
  }

  next();
};

// Generate CSRF token
export const generateCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = jwt.sign({}, process.env.JWT_SECRET!, { expiresIn: '1h' });
  res.cookie('XSRF-TOKEN', token, {
    ...COOKIE_CONFIG,
    httpOnly: false // Must be accessible to JavaScript
  });
  next();
};`;

// Write the fixed auth middleware
fs.writeFileSync('backend/src/middleware/auth.ts', authMiddlewareCode);
console.log('✅ Fixed auth middleware with improved token extraction and error handling');

// Create a script for the frontend interceptor (optional - to be used if backend fix isn't enough)
const frontendInterceptorCode = `/**
 * scripts/fix_frontend_auth_interceptor.js
 * 
 * This fixes the frontend API client to avoid sending empty Bearer tokens
 */

const fs = require('fs');

// Get the current apiClient.ts content
const apiClientPath = 'src/services/apiClient.ts';
const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');

// Check if we need to modify the interceptor
if (apiClientContent.includes('Authorization = \`Bearer ${token}\`') || 
    !apiClientContent.includes('delete config.headers.Authorization')) {
  
  // Find the request interceptor
  const interceptorRegex = /axios\.interceptors\.request\.use\(\s*\([^)]*\)\s*=>\s*{[^}]*}\s*,/;
  const match = apiClientContent.match(interceptorRegex);
  
  if (match) {
    // Create improved interceptor that avoids sending empty Bearer tokens
    const improvedInterceptor = \`axios.interceptors.request.use(
  (config) => {
    try {
      // Synchronize tokens between cookies and localStorage
      syncAuthTokens();
    } catch (error) {
      console.error('Error syncing auth tokens:', error);
    }
    
    // Get token with enhanced validation and fallbacks
    let token = null;
    
    // Try localStorage first
    const lsToken = localStorage.getItem('accessToken');
    if (lsToken && lsToken !== 'undefined' && lsToken.trim() !== '') {
      token = lsToken;
      console.log('Retrieved valid access token from localStorage');
    } else {
      // Fallback to cookies
      try {
        const cookieToken = getCookie('accessToken');
        if (cookieToken && cookieToken !== 'undefined' && cookieToken.trim() !== '') {
          token = cookieToken;
          // Store valid cookie token in localStorage
          localStorage.setItem('accessToken', token);
          console.log('Retrieved access token from cookies and saved to localStorage');
        } else {
          console.log('No valid token found in cookies');
        }
      } catch (error) {
        console.error('Error accessing cookies:', error);
      }
    }
    
    // Only add authorization header if token exists and is valid
    if (token && token !== 'undefined' && token.trim() !== '') {
      config.headers.Authorization = \`Bearer \${token}\`;
      console.log(\`Added Authorization header with valid token: Bearer \${token.substring(0, 10)}...\`);
    } else {
      // Remove Authorization header if it exists
      if (config.headers.Authorization) {
        delete config.headers.Authorization;
        console.log('Removed invalid Authorization header');
      }
    }
    return config;
  },\`;
    
    // Replace the interceptor
    const updatedContent = apiClientContent.replace(match[0], improvedInterceptor);
    fs.writeFileSync(apiClientPath, updatedContent);
    console.log('✅ Fixed frontend auth interceptor to avoid sending empty Bearer tokens');
  } else {
    console.log('⚠️ Could not find request interceptor in apiClient.ts');
  }
} else {
  console.log('⚠️ Frontend interceptor already handles empty tokens correctly');
}`;

// Write the frontend interceptor fix script (will be used if needed)
fs.writeFileSync('scripts/fix_frontend_auth_interceptor.js', frontendInterceptorCode);
console.log('✅ Created frontend interceptor fix script (optional)');

// Run the deployment
try {
  console.log('Starting deployment process...');
  
  // 1. Create build trigger file
  fs.writeFileSync('.build-trigger', `# Force rebuild for auth middleware fix: ${new Date().toISOString()}`);
  
  // 2. Build the project
  console.log('Building the project...');
  execSync('npm run build');
  
  // 3. Commit the changes
  console.log('Committing changes...');
  execSync('git add .');
  execSync('git commit -m "Fix: Auth middleware to handle malformed headers and fall back to cookies"');
  
  // 4. Deploy to Heroku
  console.log('Deploying to Heroku...');
  execSync('git push heroku fix/user-dashboard:master');
  
  console.log('✅ Deployment completed successfully!');
  console.log('\nTo verify the fix is working:');
  console.log('1. Check Heroku logs: heroku logs --tail');
  console.log('2. Look for "[AUTH-FIX-v1.2]" log entries');
  console.log('3. Verify mobile login works');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  console.log('\nYou can try manual deployment:');
  console.log('1. npm run build');
  console.log('2. git add .');
  console.log('3. git commit -m "Fix: Auth middleware to handle malformed headers and fall back to cookies"');
  console.log('4. git push heroku fix/user-dashboard:master');
}
