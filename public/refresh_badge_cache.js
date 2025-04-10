/**
 * Badge Cache Refresh Script - Enhanced Version
 * Forces the browser to reload badge data from the backend
 * Use after making direct database changes to badges
 */

// Set up debug logging
(function() {
  console.debug = function() {
    const args = Array.from(arguments);
    const prefix = '[BADGE-REFRESH] ';
    console.log(prefix + args.join(' '));
  };
})();

console.debug('Script loaded at', new Date().toISOString());

// Check if we're in a production environment
const isProduction = window.location.hostname.includes('herokuapp.com') || 
                    !window.location.hostname.includes('localhost');
console.debug('Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');

// Force clear stored badge check timestamps in localStorage
function clearLocalStorageBadgeData() {
  console.debug('Clearing badge data from localStorage...');
  
  // Find all badge-related localStorage items
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('badge_') || 
      key.startsWith('user_badges_') || 
      key.includes('badge') ||
      key.includes('Badge')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove each key
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.debug(`Removed localStorage item: ${key}`);
  });
  
  console.debug(`Cleared ${keysToRemove.length} badge-related items from localStorage`);
  return keysToRemove.length;
}

// Clear any session storage items related to badges
function clearSessionStorageBadgeData() {
  console.debug('Clearing badge data from sessionStorage...');
  
  // Find all badge-related sessionStorage items
  const keysToRemove = [];
  
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.startsWith('badge_') || 
      key.startsWith('user_badges_') || 
      key.includes('badge') ||
      key.includes('Badge')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove each key
  keysToRemove.forEach(key => {
    sessionStorage.removeItem(key);
    console.debug(`Removed sessionStorage item: ${key}`);
  });
  
  console.debug(`Cleared ${keysToRemove.length} badge-related items from sessionStorage`);
  return keysToRemove.length;
}

// Invalidate cache in the badge service
function invalidateBadgeServiceCache() {
  console.debug('Attempting to invalidate badge service cache...');
  try {
    if (typeof window !== 'undefined' && window.badgeService) {
      console.debug('Found badgeService on window object:', Object.keys(window.badgeService));
      
      // Try to invalidate any cache the service might have
      if (typeof window.badgeService.invalidateCache === 'function') {
        window.badgeService.invalidateCache();
        console.debug('Called badgeService.invalidateCache()');
      } else if (typeof window.badgeService.invalidateUserCache === 'function') {
        // If there's a user, try to invalidate their specific cache
        const userId = getCurrentUserId();
        if (userId) {
          window.badgeService.invalidateUserCache(userId);
          console.debug(`Called badgeService.invalidateUserCache('${userId}')`);
        } else {
          console.debug('No user ID found, cannot invalidate user-specific cache');
        }
      } else {
        console.debug('No invalidation methods found on badgeService:', window.badgeService);
      }
      
      return true;
    } else {
      console.debug('Badge service not found on window object');
      return false;
    }
  } catch (error) {
    console.error('Error invalidating badge service cache:', error);
    return false;
  }
}

// Try to get the current user ID from various sources
function getCurrentUserId() {
  console.debug('Attempting to find current user ID...');
  
  // Check if we have auth context on window
  if (window.authContext && window.authContext.user && window.authContext.user.id) {
    console.debug('Found user ID in authContext:', window.authContext.user.id);
    return window.authContext.user.id;
  }
  
  // Look for user ID in localStorage (common auth pattern)
  try {
    const authItems = ['currentUser', 'user', 'userData', 'auth', 'authState'];
    
    for (const item of authItems) {
      const data = localStorage.getItem(item);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed && parsed.id) {
            console.debug(`Found user ID in localStorage.${item}:`, parsed.id);
            return parsed.id;
          } else if (parsed && parsed.user && parsed.user.id) {
            console.debug(`Found user ID in localStorage.${item}.user:`, parsed.user.id);
            return parsed.user.id;
          }
        } catch (e) {
          // Not valid JSON, ignore
        }
      }
    }
    
    // Look for JWT tokens that might contain the user ID
    const tokens = ['accessToken', 'token', 'jwt'];
    for (const tokenKey of tokens) {
      const token = localStorage.getItem(tokenKey);
      if (token && token.split('.').length === 3) {
        try {
          // Try to decode the JWT payload
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload && (payload.userId || payload.user_id || payload.id || payload.sub)) {
            const userId = payload.userId || payload.user_id || payload.id || payload.sub;
            console.debug(`Found user ID in JWT token (${tokenKey}):`, userId);
            return userId;
          }
        } catch (e) {
          // Not a valid JWT, ignore
        }
      }
    }
  } catch (e) {
    console.debug('Error checking localStorage for user ID:', e);
  }
  
  console.debug('Could not find user ID');
  return null;
}

// Expose the badge service to the window object using different approaches
function exposeBadgeService() {
  console.debug('Attempting to expose badge service to window...');
  
  // Check if badgeService is already on window
  if (typeof window.badgeService !== 'undefined') {
    console.debug('Badge service already on window object');
    return invalidateBadgeServiceCache();
  }
  
  // Try to find badgeService in various ways
  const findBadgeService = () => {
    // Try approach 1: Look for it in window
    for (const key in window) {
      if (key.toLowerCase().includes('badge') && typeof window[key] === 'object') {
        console.debug(`Found potential badge service at window.${key}`);
        window.badgeService = window[key];
        return invalidateBadgeServiceCache();
      }
    }
    
    // Try approach 2: Look for it in specific bundled modules or chunks
    try {
      // Check if any module exports/chunks have been assigned to window
      for (const key in window) {
        if (typeof window[key] === 'object' && window[key] !== null) {
          // Check for a badgeService property
          const obj = window[key];
          if (obj.badgeService) {
            console.debug(`Found badgeService in window.${key}.badgeService`);
            window.badgeService = obj.badgeService;
            return invalidateBadgeServiceCache();
          }
          
          // Check for nested services property
          if (obj.services && obj.services.badgeService) {
            console.debug(`Found badgeService in window.${key}.services.badgeService`);
            window.badgeService = obj.services.badgeService;
            return invalidateBadgeServiceCache();
          }
        }
      }
    } catch (e) {
      console.debug('Error searching for badgeService in modules:', e);
    }
    
    return false;
  };
  
  // Try to find directly
  if (findBadgeService()) {
    return true;
  }
  
  // If badgeService is still not available, try dynamic imports with different paths
  const tryImport = (path) => {
    return new Promise((resolve) => {
      console.debug(`Trying to import from: ${path}`);
      import(path)
        .then(module => {
          console.debug(`Successfully imported from ${path}:`, module);
          // Look for badgeService in the module
          if (module.badgeService) {
            console.debug('Found badgeService in module.badgeService');
            window.badgeService = module.badgeService;
            invalidateBadgeServiceCache();
            resolve(true);
          } else if (module.default && module.default.badgeService) {
            console.debug('Found badgeService in module.default.badgeService');
            window.badgeService = module.default.badgeService;
            invalidateBadgeServiceCache();
            resolve(true);
          } else {
            console.debug('Module imported but badgeService not found in it');
            resolve(false);
          }
        })
        .catch(error => {
          console.debug(`Error importing from ${path}:`, error);
          resolve(false);
        });
    });
  };
  
  // In production, we can't import dynamically by source path - try a different approach
  if (isProduction) {
    console.debug('Production environment detected, using alternative approach');
    
    // Make a direct API request to force a badge refresh
    const refreshBadgeAPI = () => {
      const userId = getCurrentUserId();
      if (!userId) {
        console.debug('Cannot call API without user ID');
        return Promise.resolve(false);
      }
      
      console.debug(`Making API request to refresh badges for user ${userId}...`);
      
      return fetch(`/api/users/${userId}/badges/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // To include cookies
      })
        .then(response => {
          if (response.ok) {
            console.debug('Successfully called badge refresh API');
            return response.json().then(data => {
              console.debug('API response:', data);
              return true;
            });
          } else {
            console.debug('API call failed with status:', response.status);
            return false;
          }
        })
        .catch(error => {
          console.debug('Error calling badge refresh API:', error);
          return false;
        });
    };
    
    // Try API call (it may not exist, but worth a try)
    refreshBadgeAPI()
      .then(success => {
        if (!success) {
          console.debug('API approach failed, using full page reload as last resort');
          // Use a timeout to ensure console logs are visible
          setTimeout(() => {
            // Force reload with cache bypass
            window.location.reload(true);
          }, 2000);
        }
      });
    
    return true;
  }
  
  // In development, try to import directly
  const paths = [
    '/src/services/badgeService.js',
    '/src/services/badgeService.ts',
    '/assets/badgeService.js',
  ];
  
  Promise.all(paths.map(tryImport))
    .then(results => {
      if (!results.some(r => r)) {
        console.debug('All import attempts failed, initiating fallback approach');
        // Force reload the page as a last resort
        setTimeout(() => {
          // Add a cache-busting parameter
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('refresh_time', Date.now().toString());
          window.location.href = currentUrl.toString();
        }, 2000);
      }
    });
}

// Check if the page was refreshed within the last minute
function wasRecentlyRefreshed() {
  try {
    const lastRefresh = localStorage.getItem('badge_refresh_timestamp');
    if (lastRefresh) {
      const refreshTime = parseInt(lastRefresh, 10);
      const now = Date.now();
      const timeSinceRefresh = now - refreshTime;
      
      console.debug(`Last refresh was ${timeSinceRefresh}ms ago`);
      
      // If refreshed in last 30 seconds, avoid infinite refresh loops
      if (timeSinceRefresh < 30000) {
        console.debug('Page was recently refreshed, avoiding refresh loop');
        return true;
      }
    }
    
    // Update the refresh timestamp
    localStorage.setItem('badge_refresh_timestamp', Date.now().toString());
    return false;
  } catch (e) {
    console.debug('Error checking refresh time:', e);
    return false;
  }
}

// Run the refresh with avoidance of infinite loops
function refreshBadgeCache() {
  console.debug('Starting badge cache refresh...');
  
  // Check if we're in a refresh loop
  if (wasRecentlyRefreshed()) {
    console.debug('Avoiding refresh loop - showing status message to user');
    // Show a message to the user
    const statusElement = document.createElement('div');
    statusElement.style.position = 'fixed';
    statusElement.style.top = '10px';
    statusElement.style.right = '10px';
    statusElement.style.padding = '10px';
    statusElement.style.background = '#ffe57f';
    statusElement.style.border = '1px solid #e6c339';
    statusElement.style.borderRadius = '4px';
    statusElement.style.zIndex = '9999';
    statusElement.style.maxWidth = '300px';
    statusElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    statusElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">Badge Refresh Status</div>
      <div>Your badge data is being refreshed. This may take a moment.</div>
      <div style="font-size: 0.9em; margin-top: 10px;">
        If badges don't appear correctly, please try browsing to another page and back.
      </div>
      <button style="margin-top: 10px; padding: 5px 10px; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
        Close
      </button>
    `;
    
    // Add click handler to close button
    const closeButton = statusElement.querySelector('button');
    closeButton.addEventListener('click', () => {
      document.body.removeChild(statusElement);
    });
    
    document.body.appendChild(statusElement);
    
    return;
  }
  
  // Clear all browser storage related to badges
  const localStorageCleared = clearLocalStorageBadgeData();
  const sessionStorageCleared = clearSessionStorageBadgeData();
  
  console.debug(`Cleared ${localStorageCleared} localStorage items and ${sessionStorageCleared} sessionStorage items`);
  
  // Try to expose and invalidate the badge service cache
  exposeBadgeService();
  
  // Force expiration of any cache headers
  console.debug('Adding cache-busting headers to fetch requests...');
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('/badges') || url.includes('/users') || url.includes('/analytics')) {
      console.debug('Cache-busting request to:', url);
      
      // If the first argument is a string URL
      if (typeof args[0] === 'string') {
        const urlObj = new URL(args[0], window.location.origin);
        urlObj.searchParams.set('_', Date.now().toString());
        args[0] = urlObj.toString();
      }
      
      // If second argument exists with headers
      if (args[1] && args[1].headers) {
        const newOptions = { ...args[1] };
        const newHeaders = new Headers(newOptions.headers);
        newHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        newHeaders.set('Pragma', 'no-cache');
        newHeaders.set('Expires', '0');
        newOptions.headers = newHeaders;
        args[1] = newOptions;
      } else if (args[1]) {
        // Add headers if options exist but no headers
        const newOptions = { ...args[1] };
        newOptions.headers = {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };
        args[1] = newOptions;
      } else {
        // Add options with headers if no options exist
        args.push({
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
      }
    }
    return originalFetch.apply(this, args);
  };
  
  // Message to user
  console.debug('Badge cache refresh completed. You may need to navigate to another page and back.');
  
  // Add a visible notification for the user
  const refreshCompleteNotice = document.createElement('div');
  refreshCompleteNotice.style.position = 'fixed';
  refreshCompleteNotice.style.top = '10px';
  refreshCompleteNotice.style.right = '10px';
  refreshCompleteNotice.style.padding = '10px';
  refreshCompleteNotice.style.background = '#4caf50';
  refreshCompleteNotice.style.color = 'white';
  refreshCompleteNotice.style.borderRadius = '4px';
  refreshCompleteNotice.style.zIndex = '9999';
  refreshCompleteNotice.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  refreshCompleteNotice.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">Badge Cache Cleared</div>
    <div>Your badge data has been refreshed. Navigate to the Achievements tab to see changes.</div>
    <button style="margin-top: 10px; padding: 5px 10px; background: #fff; color: #333; border: none; border-radius: 4px; cursor: pointer;">
      Close
    </button>
  `;
  
  // Add click handler to close button
  const closeButton = refreshCompleteNotice.querySelector('button');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(refreshCompleteNotice);
  });
  
  // Auto-hide after 8 seconds
  setTimeout(() => {
    if (document.body.contains(refreshCompleteNotice)) {
      document.body.removeChild(refreshCompleteNotice);
    }
  }, 8000);
  
  // Wait for the DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(refreshCompleteNotice);
    });
  } else {
    document.body.appendChild(refreshCompleteNotice);
  }
}

// Execute the refresh
refreshBadgeCache();
