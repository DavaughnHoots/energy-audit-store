/**
 * Product Image Service
 * 
 * This service handles fetching and caching product images from Unsplash API.
 * It provides a consistent way to retrieve images based on product categories and names,
 * with fallbacks for when the API fails or is unavailable.
 */

import predefinedCategoryImages from '../../public/data/category-images.json';
import customImages from '../../public/data/custom-category-images.json';

// Image response interface with attribution data
interface UnsplashImageResponse {
  url: string;
  id: string;
  photographer: string;
  photographerUsername: string;
  photographerUrl: string;
}

// Export type for product image data with attribution
export type ProductImageData = {
  url: string;
  photographer: string;
  photographerUrl: string;
};

// In-memory cache to store image data by category and product name
interface ImageCache {
  [key: string]: {
    data: UnsplashImageResponse;
    expires: number;
  };
}

const imageCache: ImageCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Keywords to use for each product category to improve image search relevance
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'HVAC': ['air conditioner', 'heating system', 'energy efficient hvac'],
  'Lighting': ['led light bulb', 'energy efficient lighting', 'modern lamp'],
  'Appliances': ['energy star appliance', 'efficient refrigerator', 'smart appliance'],
  'Insulation': ['home insulation', 'insulation material', 'thermal insulation'],
  'Windows': ['energy efficient window', 'double pane window', 'window installation'],
  'Solar': ['solar panel', 'solar energy', 'rooftop solar'],
  'WaterHeating': ['water heater', 'tankless water heater', 'efficient water heating'],
  'Building Products': ['construction material', 'building insulation', 'eco building'],
  'Commercial Appliances': ['commercial refrigerator', 'commercial kitchen', 'industrial appliance'],
  'Commercial Food Service Equipment': ['restaurant equipment', 'commercial oven', 'industrial kitchen'],
  'Data Center Equipment': ['server rack', 'data center cooling', 'server room'],
  'Electronics': ['energy efficient electronics', 'eco computer', 'green electronics'],
  'Heating & Cooling': ['hvac system', 'efficient heating', 'home climate control'],
  'Lighting & Fans': ['led lighting', 'ceiling fan', 'energy efficient bulb'],
  'Office Equipment': ['efficient printer', 'office electronics', 'energy star office']
};

// Default fallback images if API fails or is unavailable
const DEFAULT_IMAGES: Record<string, string> = {
  'HVAC': 'https://images.unsplash.com/photo-1617104551722-3b2d51366400?auto=format&fit=crop&w=600&q=80',
  'Lighting': 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=600&q=80',
  'Appliances': 'https://images.unsplash.com/photo-1556911220-6bfac35a0d68?auto=format&fit=crop&w=600&q=80',
  'Insulation': 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=600&q=80',
  'Windows': 'https://images.unsplash.com/photo-1503708928676-1cb796a0891e?auto=format&fit=crop&w=600&q=80',
  'Solar': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=600&q=80',
  'WaterHeating': 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=600&q=80',
  'Building Products': 'https://images.unsplash.com/photo-1573599852326-2a1bd9a5fc82?auto=format&fit=crop&w=600&q=80',
  'Commercial Appliances': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80',
  'Commercial Food Service Equipment': 'https://images.unsplash.com/photo-1579620586767-8f6b2422f605?auto=format&fit=crop&w=600&q=80',
  'Data Center Equipment': 'https://images.unsplash.com/photo-1581092583537-20d51b4024ec?auto=format&fit=crop&w=600&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1648423980346-5c71dd08ad6d?auto=format&fit=crop&w=600&q=80',
  'Heating & Cooling': 'https://images.unsplash.com/photo-1629948618343-0d33f80d1da6?auto=format&fit=crop&w=600&q=80',
  'Lighting & Fans': 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80',
  'Office Equipment': 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&q=80'
};

// Ultimate fallback image if nothing else is available
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1556911220-6bfac35a0d68?auto=format&fit=crop&w=600&q=80';

// Unsplash API key
const UNSPLASH_ACCESS_KEY = 'qQWIia8U-dBGBdvr8N3SDAqLld78JkfAAme86bf-36U';

/**
 * Helper to normalize category names for consistent lookup
 * This helps match displayed category names with JSON keys
 */
const normalizeCategory = (category: string): string => {
  // Strip special characters, standardize ampersands, and trim whitespace
  const normalized = category
    .replace(/&\s*/g, '& ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  console.log(`Normalized category: "${category}" -> "${normalized}"`);
  return normalized;
};

/**
 * Helper function to format the Unsplash image URL with proper parameters
 */
const formatImageUrl = (url: string): string => {
  if (!url) return '';
  
  // If URL already has query parameters, add to them
  if (url.includes('?')) {
    // If it doesn't already have these params
    if (!url.includes('auto=format')) {
      url += '&auto=format&fit=crop&w=800&q=80';
    }
  } else {
    // Add query parameters
    url += '?auto=format&fit=crop&w=800&q=80';
  }
  
  return url;
};

/**
 * Gets the custom image for a category if available
 */
const getCustomImage = (category: string): ProductImageData | null => {
  const normalizedCategory = normalizeCategory(category);
  
  try {
    // First check if it's a subcategory
    // @ts-ignore - JSON import type handling
    if (customImages.subCategories && customImages.subCategories[normalizedCategory]) {
      // @ts-ignore - JSON import type handling
      const image = customImages.subCategories[normalizedCategory];
      console.log(`Found custom subcategory image for ${normalizedCategory}`);
      
      return {
        url: formatImageUrl(image.url),
        photographer: image.photographer || 'Unsplash',
        photographerUrl: image.photographerUrl || 'https://unsplash.com'
      };
    }
    
    // Then check main categories
    // @ts-ignore - JSON import type handling
    if (customImages.mainCategories && customImages.mainCategories[normalizedCategory]) {
      // @ts-ignore - JSON import type handling
      const image = customImages.mainCategories[normalizedCategory];
      console.log(`Found custom main category image for ${normalizedCategory}`);
      
      return {
        url: formatImageUrl(image.url),
        photographer: image.photographer || 'Unsplash',
        photographerUrl: image.photographerUrl || 'https://unsplash.com'
      };
    }
  } catch (error) {
    console.error(`Error accessing custom images for ${normalizedCategory}:`, error);
  }
  
  return null;
};

/**
 * Track a download event for an Unsplash image
 * This is required by Unsplash's API terms when a user views an image
 */
export async function trackImageDownload(imageId: string): Promise<void> {
  if (!imageId) return;
  
  try {
    await fetch(`https://api.unsplash.com/photos/${imageId}/download`, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });
    console.log(`Tracked download for image ID: ${imageId}`);
  } catch (error) {
    console.error('Failed to track Unsplash download:', error);
  }
}

// Add localStorage helpers
const getLocalStorageCache = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsedItem = JSON.parse(item);
    if (parsedItem.expires < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }
    return parsedItem.data;
  } catch (e) {
    console.error('Error reading from localStorage:', e);
    return null;
  }
};

const setLocalStorageCache = (key: string, data: any, duration: number) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      expires: Date.now() + duration
    }));
  } catch (e) {
    console.error('Error writing to localStorage:', e);
  }
};

/**
 * Gets category-specific image data optimized for category browsing
 * Uses specialized cache and predefined images for better category representation
 */
export async function getCategoryImage(
  category: string,
  additionalKeyword?: string,
  forceFresh = false
): Promise<ProductImageData> {
  const normalizedCategory = normalizeCategory(category);
  const cacheKey = `category_image_${normalizedCategory.toLowerCase()}_${additionalKeyword || ''}`;
  
  console.log(`Getting image for category: "${category}", normalized: "${normalizedCategory}"`);
  
  // First, check for custom images from our curated collection regardless of cache status
  const customImage = getCustomImage(normalizedCategory);
  if (customImage) {
    // Always cache the custom image on retrieval
    console.log(`Using custom image for ${normalizedCategory}`);
    setLocalStorageCache(cacheKey, customImage, CACHE_DURATION);
    return customImage;
  }
  
  // Check localStorage cache if not forcing fresh and no custom image was found
  if (!forceFresh) {
    const cachedData = getLocalStorageCache(cacheKey);
    if (cachedData) {
      console.log(`Using cached image for ${normalizedCategory}`);
      return cachedData;
    }
  }
  
  // Next, try to use predefined images
  try {
    // @ts-ignore - JSON import type handling
    if (predefinedCategoryImages[normalizedCategory] && predefinedCategoryImages[normalizedCategory].length > 0) {
      // Randomly select one of the predefined images
      // @ts-ignore - JSON import type handling
      const imagePool = predefinedCategoryImages[normalizedCategory];
      console.log(`Found ${imagePool.length} predefined images for ${normalizedCategory}`);
      
      const randomIndex = Math.floor(Math.random() * imagePool.length);
      const selectedImage = imagePool[randomIndex];
      
      // Cache the selected image
      setLocalStorageCache(cacheKey, selectedImage, CACHE_DURATION);
      return selectedImage;
    } else {
      console.log(`No predefined images found for ${normalizedCategory}`);
    }
  } catch (error) {
    console.error(`Error accessing predefined images for ${normalizedCategory}:`, error);
  }
  
  // If no predefined image, proceed with API call logic
  try {
    // Build optimized search query for categories
    let query = `${category} energy efficient`;
    
    // Add category-specific keywords for better results
    if (CATEGORY_KEYWORDS[normalizedCategory] && CATEGORY_KEYWORDS[normalizedCategory].length > 0) {
      // Use random keyword from the array for variety
      const randomIndex = Math.floor(Math.random() * CATEGORY_KEYWORDS[normalizedCategory].length);
      query += ` ${CATEGORY_KEYWORDS[normalizedCategory][randomIndex]}`;
    }
    
    if (additionalKeyword) {
      query += ` ${additionalKeyword}`;
    }
    
    console.log(`Fetching from Unsplash with query: "${query}"`);
    
    // Request a high-quality landscape image that works well for category tiles
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch category image: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.urls || typeof data.urls.regular !== 'string') {
      throw new Error('Invalid response format from Unsplash API');
    }
    
    // Extract relevant data
    const imageData: UnsplashImageResponse = {
      url: data.urls.regular as string,
      id: data.id as string,
      photographer: data.user?.name || 'Unsplash Photographer',
      photographerUsername: data.user?.username || '',
      photographerUrl: data.user?.links?.html || 'https://unsplash.com'
    };
    
    // Cache the result in memory
    imageCache[cacheKey] = {
      data: imageData,
      expires: Date.now() + CACHE_DURATION
    };
    
    // Also cache in localStorage for persistence between page refreshes
    setLocalStorageCache(cacheKey, {
      url: imageData.url,
      photographer: imageData.photographer,
      photographerUrl: imageData.photographerUrl
    }, CACHE_DURATION);
    
    return {
      url: imageData.url,
      photographer: imageData.photographer,
      photographerUrl: imageData.photographerUrl
    };
  } catch (error) {
    console.error(`Error fetching image for category ${category}:`, error);
    
    // First try category-specific fallback
    if (DEFAULT_IMAGES[normalizedCategory]) {
      console.log(`Using default image for ${normalizedCategory}`);
      return {
        url: DEFAULT_IMAGES[normalizedCategory],
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      };
    }
    
    // Then try generic 'Appliances' fallback
    if (DEFAULT_IMAGES['Appliances']) {
      console.log(`Using Appliances fallback image for ${normalizedCategory}`);
      return {
        url: DEFAULT_IMAGES['Appliances'],
        photographer: 'Unsplash',
        photographerUrl: 'https://unsplash.com'
      };
    }
    
    // Ultimate fallback
    console.log(`Using ultimate fallback image for ${normalizedCategory}`);
    return {
      url: FALLBACK_IMAGE,
      photographer: 'Unsplash',
      photographerUrl: 'https://unsplash.com'
    };
  }
}

/**
 * Rate-limiting functions for image refreshing
 */
export function canRefreshCategoryImage(category: string): boolean {
  const normalizedCategory = normalizeCategory(category);
  const refreshKey = `last_refresh_${normalizedCategory.toLowerCase()}`;
  const lastRefresh = localStorage.getItem(refreshKey);
  
  if (!lastRefresh) return true;
  
  // Allow refresh once per hour
  const ONE_HOUR = 60 * 60 * 1000;
  return (Date.now() - parseInt(lastRefresh, 10)) > ONE_HOUR;
}

export function markCategoryImageRefreshed(category: string): void {
  const normalizedCategory = normalizeCategory(category);
  const refreshKey = `last_refresh_${normalizedCategory.toLowerCase()}`;
  localStorage.setItem(refreshKey, Date.now().toString());
}

/**
 * Force clears all image cache entries from localStorage
 * Returns a count of cleared entries
 */
export function clearImageCache(): number {
  let count = 0;
  
  // Collect all keys related to image caching
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    if (key && (
      key.startsWith('category_image_') || 
      key.startsWith('last_refresh_') ||
      key.includes('_image_')
    )) {
      localStorage.removeItem(key);
      count++;
      console.log(`Cleared image cache: ${key}`);
    }
  }
  
  console.log(`Cleared ${count} image cache entries from localStorage`);
  return count;
}
