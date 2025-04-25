import React, { useState, useEffect } from 'react';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';
import { AnalyticsArea } from '../../context/AnalyticsContext';
import { RefreshCw } from 'lucide-react';
import { getCategoryImage, canRefreshCategoryImage, markCategoryImageRefreshed } from '../../services/productImageService';
import { ProductImageData } from '../../services/productImageService';

interface CategoryGalleryProps {
  categories: string[];
  onCategorySelect: (category: string) => void;
}

interface CategoryTileProps {
  category: string;
  onSelect: () => void;
}

const CategoryTile: React.FC<CategoryTileProps> = ({ category, onSelect }) => {
  const [imageData, setImageData] = useState<ProductImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(() => canRefreshCategoryImage(category));
  
  // Default placeholder image as base64 - gray background with category text
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgdmlld0JveD0iMCAwIDgwMCA0NTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9IiNFQUVBRUEiLz48bGluZWFyR3JhZGllbnQgaWQ9InNoYWRvdyIgeDE9IjAiIHkxPSIyMjUiIHgyPSIwIiB5Mj0iNDUwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSJyZ2JhKDAsMCwwLDApIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSJyZ2JhKDAsMCwwLDAuNykiLz48L2xpbmVhckdyYWRpZW50PjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiBmaWxsPSJ1cmwoI3NoYWRvdykiLz48dGV4dCB4PSI0MDAiIHk9IjIyNSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNzc3Nzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q2F0ZWdvcnkgSW1hZ2U8L3RleHQ+PC9zdmc+';
  
  useEffect(() => {
    const fetchCategoryImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Log the exact category name to help with debugging
        console.log(`Fetching image for category: "${category}"`);
        
        const data = await getCategoryImage(category, category);
        console.log(`Image data received for ${category}:`, data ? 'success' : 'null');
        setImageData(data);
      } catch (err) {
        console.error(`Error fetching image for ${category}:`, err);
        setError('Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategoryImage();
  }, [category]);
  
  // Handle refresh button click
  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the tile selection
    
    if (!canRefresh) return;
    
    try {
      setIsLoading(true);
      const data = await getCategoryImage(category, category, true); // Force fresh
      setImageData(data);
      markCategoryImageRefreshed(category);
      setCanRefresh(false);
      
      // Update status after cooldown
      setTimeout(() => setCanRefresh(canRefreshCategoryImage(category)), 1000);
    } catch (err) {
      console.error(`Error refreshing image for ${category}:`, err);
      setError('Failed to refresh image');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div 
      className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={onSelect}
      role="button"
      aria-label={`Select ${category} category`}
    >
      {/* Fixed aspect ratio container */}
      <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
        {isLoading ? (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-gray-400">Loading...</span>
          </div>
        ) : error ? (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center p-4">
            <span className="text-gray-500 text-center">{category}</span>
          </div>
        ) : (
          <>
            <img 
              src={imageData?.url || placeholderImage} 
              alt={`${category} category`}
              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                console.error(`Image failed to load for ${category}`);
                // Use the placeholder image when external image fails
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite error loops
                target.src = placeholderImage;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </>
        )}
        
        {/* Category name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-xl font-semibold">{category}</h3>
        </div>
        
        {/* Refresh button */}
        <button
          className={`absolute top-2 right-2 p-1 rounded-full ${canRefresh ? 'bg-black/30 hover:bg-black/50' : 'bg-black/20 cursor-not-allowed'} transition-colors`}
          onClick={handleRefresh}
          disabled={!canRefresh}
          title={canRefresh ? "Refresh image" : "Image refresh on cooldown"}
          aria-label={canRefresh ? "Refresh image" : "Image refresh on cooldown"}
        >
          <RefreshCw className={`h-4 w-4 ${canRefresh ? 'text-white' : 'text-white/60'}`} />
        </button>
        
        {/* Image attribution */}
        {imageData && imageData.photographer && !error && (
          <div className="absolute bottom-0 right-0 p-1 text-xs text-white/70 bg-black/30 rounded-tl-md">
            Photo: {imageData.photographer}
          </div>
        )}
      </div>
    </div>
  );
};

const CategoryGallery: React.FC<CategoryGalleryProps> = ({ categories, onCategorySelect }) => {
  // Use component tracking
  const trackCategorySelect = useComponentTracking('products2' as AnalyticsArea, 'CategorySelect');
  
  const handleCategorySelect = (category: string) => {
    trackCategorySelect('click', { category });
    onCategorySelect(category);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Browse by Category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryTile 
            key={category}
            category={category}
            onSelect={() => handleCategorySelect(category)}
          />
        ))}
      </div>
    </div>
  );
};

export default CategoryGallery;