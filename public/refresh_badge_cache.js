/**
 * Badge Cache Refresh Script
 * Forces the browser to reload badge data from the backend
 * Use after making direct database changes to badges
 */

// Force clear stored badge check timestamps in localStorage
function clearLocalStorageBadgeData() {
  console.log('Clearing badge data from localStorage...');
  
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
    console.log(`Removed: ${key}`);
  });
  
  console.log(`Cleared ${keysToRemove.length} badge-related items from localStorage`);
}

// Invalidate cache in the badge service
function invalidateBadgeServiceCache() {
  console.log('Invalidating badge service cache...');
  try {
    if (typeof window !== 'undefined' && window.badgeService) {
      window.badgeService.invalidateCache();
      console.log('Badge service cache invalidated successfully');
    } else {
      console.warn('Badge service not found on window object');
    }
  } catch (error) {
    console.error('Error invalidating badge service cache:', error);
  }
}

// Expose the badge service to the window object
// This allows us to call methods on it from the console
function exposeBadgeService() {
  try {
    // Import the badge service module
    import('/src/services/badgeService.js')
      .then(module => {
        // Make the badge service accessible from the global window object
        window.badgeService = module.badgeService;
        console.log('Badge service exposed to window.badgeService');
        
        // Now invalidate the cache
        invalidateBadgeServiceCache();
      })
      .catch(error => {
        console.error('Error importing badge service:', error);
      });
  } catch (error) {
    console.error('Error exposing badge service:', error);
  }
}

// Run the refresh
function refreshBadgeCache() {
  console.log('Starting badge cache refresh...');
  
  // Clear localStorage cached badge data
  clearLocalStorageBadgeData();
  
  // Expose and invalidate the badge service cache
  exposeBadgeService();
  
  console.log('Badge cache refresh initiated. Please wait a moment and then refresh the page.');
}

// Execute the refresh
refreshBadgeCache();
