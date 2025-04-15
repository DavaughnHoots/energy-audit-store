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
  
  useEffect(() => {
    const fetchCategoryImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getCategoryImage(category, category);
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
      {/* Image with overlay */}
      <div className="aspect-w-16 aspect-h-9 group">
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
              src={imageData?.url} 
              alt={`${category} category`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
          </>
        )}
        
        {/* Category name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-xl font-semibold">{category}</h3>
        </div>
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
      {imageData && imageData.photographer && (
        <div className="absolute bottom-0 right-0 p-1 text-xs text-white/70 bg-black/30 rounded-tl-md">
          Photo: {imageData.photographer}
        </div>
      )}
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