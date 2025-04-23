/**
 * Quick fix for authentication token and cookie handling issues
 * 
 * This script focuses on the most critical issues:
 * 1. Preventing 'undefined' as a literal string in cookies
 * 2. Ensuring proper storage and retrieval of tokens
 */

const fs = require('fs');
const path = require('path');

// Files to update
const FILES_TO_UPDATE = {
  COOKIE_UTILS: 'src/utils/cookieUtils.ts'
};

// Log with timestamp
const log = (message) => {
  console.log(`[QUICK-FIX] ${message}`);
};

// Enhanced cookieUtils.ts with improved validation
const ENHANCED_COOKIE_UTILS = `
import { serialize, SerializeOptions } from 'cookie';

/**
 * Parse cookies from string
 */
export function parseCookies(cookieStr = document.cookie) {
  return cookieStr
    .split(';')
    .map(v => v.trim())
    .reduce((acc, current) => {
      const [name, ...value] = current.split('=');
      if (name) acc[name] = decodeURIComponent(value.join('='));
      return acc;
    }, {});
}

/**
 * Get cookie by name (with validation)
 */
export function getCookie(name) {
  const cookies = parseCookies();
  const value = cookies[name];
  
  // Return null for undefined, "undefined", or empty strings
  if (!value || value === 'undefined' || value.trim() === '') {
    return null;
  }
  
  return value;
}

/**
 * Set cookie with validation
 */
export function setCookie(name, value, opts = {}) {
  // Never set cookies to undefined or empty values
  if (!value || value === 'undefined' || value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    console.warn("Invalid cookie value for " + name + ", not setting");
    return;
  }

  document.cookie = serialize(name, value, {
    path: '/',
    sameSite: 'strict',
    ...opts,
  });
  
  console.log("Cookie set: " + name);
}

/**
 * Remove cookie
 */
export function removeCookie(name, opts = {}) {
  document.cookie = serialize(name, '', {
    path: '/',
    sameSite: 'strict',
    expires: new Date(0),
    ...opts,
  });
  
  console.log("Cookie removed: " + name);
}

/**
 * Sync tokens between localStorage and cookies
 */
export function syncAuthTokens() {
  try {
    // Get tokens from all sources
    const cookies = parseCookies();
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Clean up invalid values
    if (cookies.accessToken === 'undefined' || (cookies.accessToken && cookies.accessToken.trim() === '')) {
      removeCookie('accessToken');
    }
    
    if (cookies.refreshToken === 'undefined' || (cookies.refreshToken && cookies.refreshToken.trim() === '')) {
      removeCookie('refreshToken');
    }
    
    if (accessToken === 'undefined' || (accessToken && accessToken.trim() === '')) {
      localStorage.removeItem('accessToken');
    }
    
    if (refreshToken === 'undefined' || (refreshToken && refreshToken.trim() === '')) {
      localStorage.removeItem('refreshToken');
    }
    
    // Sync valid tokens from cookies to localStorage
    if (cookies.accessToken && cookies.accessToken !== 'undefined' && cookies.accessToken.trim() !== '') {
      if (!accessToken || accessToken !== cookies.accessToken) {
        localStorage.setItem('accessToken', cookies.accessToken);
      }
    }
    
    if (cookies.refreshToken && cookies.refreshToken !== 'undefined' && cookies.refreshToken.trim() !== '') {
      if (!refreshToken || refreshToken !== cookies.refreshToken) {
        localStorage.setItem('refreshToken', cookies.refreshToken);
      }
    }
    
    // Sync valid tokens from localStorage to cookies
    if (accessToken && accessToken !== 'undefined' && accessToken.trim() !== '') {
      if (!cookies.accessToken || cookies.accessToken !== accessToken) {
        setCookie('accessToken', accessToken, { maxAge: 15 * 60 });
      }
    }
    
    if (refreshToken && refreshToken !== 'undefined' && refreshToken.trim() !== '') {
      if (!cookies.refreshToken || cookies.refreshToken !== refreshToken) {
        setCookie('refreshToken', refreshToken, { maxAge: 7 * 24 * 60 * 60 });
      }
    }
  } catch (error) {
    console.error('Error syncing tokens:', error);
  }
}
`;

// Main function
async function fix() {
  try {
    log('Starting quick token and cookie validation fix');
    
    // Update cookieUtils.ts
    log(`Updating ${FILES_TO_UPDATE.COOKIE_UTILS}`);
    fs.writeFileSync(FILES_TO_UPDATE.COOKIE_UTILS, ENHANCED_COOKIE_UTILS, 'utf8');
    log(`Updated ${FILES_TO_UPDATE.COOKIE_UTILS} successfully`);
    
    log('Quick fix completed successfully');
    log('To deploy this fix: node scripts/direct_cookie_token_fix.js');

  } catch (error) {
    log(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run the fix
fix();
