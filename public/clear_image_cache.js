/**
 * Clear Image Cache Utility
 * 
 * This script clears all image-related localStorage items to force fresh image loading.
 * It can be used to resolve issues with stale or broken image URLs in the cache.
 */

// Function to clear all image-related localStorage entries
function clearImageCache() {
  try {
    // First try to use the productImageService's implementation if available
    // This handles the case when this script is included in the main app
    if (typeof window.productImageService !== 'undefined' && 
        typeof window.productImageService.clearImageCache === 'function') {
      console.log('Using productImageService implementation to clear cache');
      const count = window.productImageService.clearImageCache();
      return {
        success: true,
        clearedCount: count,
        message: `Successfully cleared ${count} image cache entries from localStorage`
      };
    }
    
    // Fallback implementation if the service isn't available
    let count = 0;
    const keysToRemove = [];
    
    // Collect all keys related to image caching
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Match all image cache entries
      if (key && (
        key.startsWith('category_image_') || 
        key.startsWith('last_refresh_') ||
        key.includes('_image_')
      )) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all collected keys
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      count++;
      console.log(`Cleared image cache: ${key}`);
    });
    
    console.log(`Cleared ${count} image cache entries from localStorage`);
    return {
      success: true,
      clearedCount: count,
      message: `Successfully cleared ${count} image cache entries from localStorage`
    };
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return {
      success: false,
      clearedCount: 0,
      message: `Error clearing cache: ${error.message || 'Unknown error'}`
    };
  }
}

// Run when page loads
window.addEventListener('DOMContentLoaded', function() {
  const result = clearImageCache();
  console.log('Image cache clearing result:', result);
  
  // Display result to user
  const resultElement = document.createElement('div');
  resultElement.style.position = 'fixed';
  resultElement.style.top = '20px';
  resultElement.style.left = '50%';
  resultElement.style.transform = 'translateX(-50%)';
  resultElement.style.padding = '15px 20px';
  resultElement.style.background = '#4CAF50';
  resultElement.style.color = 'white';
  resultElement.style.borderRadius = '4px';
  resultElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  resultElement.style.zIndex = '9999';
  resultElement.style.maxWidth = '400px';
  resultElement.style.textAlign = 'center';
  
  resultElement.innerHTML = `
    <strong>Image Cache Cleared!</strong><br>
    ${result.clearedCount} image URLs have been removed from cache.<br>
    <small>You may now close this page and return to the application.</small>
  `;
  
  document.body.appendChild(resultElement);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    resultElement.style.opacity = '0';
    resultElement.style.transition = 'opacity 0.5s ease-out';
    setTimeout(() => resultElement.remove(), 500);
  }, 5000);
});
