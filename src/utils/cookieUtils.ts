import { serialize, SerializeOptions } from 'cookie';
import { isValidToken } from './tokenUtils';

/**
 * Detect mobile devices based on user agent
 */
export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
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
 * Check if a token value is valid
 */
export function isValidToken(token) {
  return token && token !== 'undefined' && token !== 'null' && token.trim() !== '';
}

/**
 * Set cookie with validation and retry mechanism
 */
export function setCookie(name, value, opts = {}, retryCount = 0) {
  // Never set cookies to undefined or empty values
  if (!isValidToken(value)) {
    console.warn("⚠️ Invalid cookie value for " + name + ", not setting");
    return false;
  }

  // Check for mobile and adjust strategy
  const isMobile = isMobileDevice();
  
  // On mobile, ALWAYS try localStorage first as primary storage
  if (isMobile) {
    try {
      localStorage.setItem(name, value);
      console.log(`📱 Mobile detected, stored ${name} in localStorage`);
    } catch (lsError) {
      console.error('📱 Mobile localStorage storage failed:', lsError);
    }
  }
  
  // Set sameSite value based on device type
  const sameSiteValue = isMobile ? 'none' : 'lax';
  // Add secure flag for 'none' SameSite
  const secureFlag = sameSiteValue === 'none';
  
  console.log(`📱 Device is ${isMobile ? 'mobile' : 'desktop'}, using SameSite=${sameSiteValue}, secure=${secureFlag}`);

  try {
    document.cookie = serialize(name, value, {
      path: '/',
      sameSite: sameSiteValue,
      secure: secureFlag || opts.secure,
      ...opts,
    });
    
    // Verify the cookie was actually set
    const cookies = parseCookies();
    if (cookies[name] === value) {
      console.log("✅ Cookie set successfully: " + name);
      return true;
    } else {
      console.warn("⚠️ Cookie verification failed for " + name);
      
      // For mobile, consider localStorage success as overall success
      if (isMobile && localStorage.getItem(name) === value) {
        console.log("📱 Using localStorage fallback on mobile as primary");
        return true;
      }
      
      // Retry up to 2 times if setting failed
      if (retryCount < 2) {
        console.log(`🔄 Retrying cookie set (attempt ${retryCount + 1})...`);
        // Wait a bit and retry
        setTimeout(() => {
          setCookie(name, value, opts, retryCount + 1);
        }, 100);
      } else {
        console.error(`❌ Failed to set cookie ${name} after ${retryCount} retries`);
      }
      return false;
    }
  } catch (error) {
    console.error(`❌ Error setting cookie ${name}:`, error);
    return false;
  }
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
  
  console.log("🗑️ Cookie removed: " + name);
}

/**
 * Sync tokens between localStorage and cookies with enhanced reliability
 */
export function syncAuthTokens(forceSync = false) {
  try {
    console.log(`🔄 Syncing auth tokens${forceSync ? ' (forced)' : ''}...`);
    
    // Get tokens from all sources
    const cookies = parseCookies();
    // Use item() to avoid exceptions
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Always check and clean cookie values first
    if (cookies.accessToken && !isValidToken(cookies.accessToken)) {
      console.log('🧹 Removing invalid accessToken cookie:', cookies.accessToken);
      removeCookie('accessToken');
    }
    
    if (cookies.refreshToken && !isValidToken(cookies.refreshToken)) {
      console.log('🧹 Removing invalid refreshToken cookie:', cookies.refreshToken);
      removeCookie('refreshToken');
    }
    
    // Then check localStorage values
    if (accessToken && !isValidToken(accessToken)) {
      console.log('🧹 Removing invalid accessToken from localStorage:', accessToken);
      localStorage.removeItem('accessToken');
    }
    
    if (refreshToken && !isValidToken(refreshToken)) {
      console.log('🧹 Removing invalid refreshToken from localStorage:', refreshToken);
      localStorage.removeItem('refreshToken');
    }
    
    // Re-read values after cleanup
    const updatedCookies = parseCookies();
    const hasValidAccessTokenInCookies = updatedCookies.accessToken && isValidToken(updatedCookies.accessToken);
    const hasValidRefreshTokenInCookies = updatedCookies.refreshToken && isValidToken(updatedCookies.refreshToken);
    
    // Re-read localStorage after cleanup
    const updatedAccessToken = localStorage.getItem('accessToken');
    const updatedRefreshToken = localStorage.getItem('refreshToken');
    const hasValidAccessTokenInLS = updatedAccessToken && isValidToken(updatedAccessToken);
    const hasValidRefreshTokenInLS = updatedRefreshToken && isValidToken(updatedRefreshToken);
    
    
    // Priority logic for mobile vs desktop with console table logging
    const isMobile = isMobileDevice();
    let finalAccessToken = null;
    let finalRefreshToken = null;
    
    if (isMobile) {
      // On mobile, STRONGLY prefer localStorage with cookie fallback
      finalAccessToken = hasValidAccessTokenInLS ? updatedAccessToken : 
                       (hasValidAccessTokenInCookies ? updatedCookies.accessToken : null);
                       
      finalRefreshToken = hasValidRefreshTokenInLS ? updatedRefreshToken : 
                        (hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : null);
                        
      console.log('📱 Mobile device - prioritizing localStorage tokens over cookies');
    } else {
      // On desktop, prefer cookies with localStorage fallback
      finalAccessToken = hasValidAccessTokenInCookies ? updatedCookies.accessToken : 
                       (hasValidAccessTokenInLS ? updatedAccessToken : null);
                       
      finalRefreshToken = hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : 
                        (hasValidRefreshTokenInLS ? updatedRefreshToken : null);
                        
      console.log('🖥️ Desktop device - prioritizing cookie tokens over localStorage');
    }
    
    // Log token diagnostic info (helps with debugging)
    console.table({
      Source: ['cookie', 'localStorage'],
      access: [!!updatedCookies.accessToken, !!updatedAccessToken],
      refresh: [!!updatedCookies.refreshToken, !!updatedRefreshToken]
    }); = null;
    
    if (isMobile) {
      // On mobile, prefer localStorage with cookie fallback
      finalAccessToken = hasValidAccessTokenInLS ? updatedAccessToken : 
                        (hasValidAccessTokenInCookies ? updatedCookies.accessToken : null);
                        
      finalRefreshToken = hasValidRefreshTokenInLS ? updatedRefreshToken : 
                         (hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : null);
    } else {
      // On desktop, prefer cookies with localStorage fallback
      finalAccessToken = hasValidAccessTokenInCookies ? updatedCookies.accessToken : 
                        (hasValidAccessTokenInLS ? updatedAccessToken : null);
                        
      finalRefreshToken = hasValidRefreshTokenInCookies ? updatedCookies.refreshToken : 
                         (hasValidRefreshTokenInLS ? updatedRefreshToken : null);
    }
    
    // Apply the final tokens to both storage mechanisms
    console.log('🔄 Synchronizing with final token values:',
      finalAccessToken ? 'Access token present' : 'No valid access token',
      finalRefreshToken ? 'Refresh token present' : 'No valid refresh token',
      isMobile ? '(Mobile strategy)' : '(Desktop strategy)');
    
    // Always set (or clear) both storage mechanisms when doing a force sync
    if (finalAccessToken) {
      localStorage.setItem('accessToken', finalAccessToken);
      setCookie('accessToken', finalAccessToken, { maxAge: 15 * 60 });
    } else {
      localStorage.removeItem('accessToken');
      removeCookie('accessToken');
    }
    
    if (finalRefreshToken) {
      localStorage.setItem('refreshToken', finalRefreshToken);
      setCookie('refreshToken', finalRefreshToken, { maxAge: 7 * 24 * 60 * 60 });
    } else {
      localStorage.removeItem('refreshToken');
      removeCookie('refreshToken');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error syncing tokens:', error);
    return false;
  }
}

/**
 * Authentication reset - clears all auth state
 */
export function resetAuthState() {
  console.log('🧹 Performing complete auth state reset...');
  
  // Clear cookies
  removeCookie('accessToken');
  removeCookie('refreshToken');
  removeCookie('XSRF-TOKEN');
  
  // Clear localStorage
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('auth-state');
  
  console.log('✅ Auth state reset complete');
  return true;
}