import React, { useState, useEffect } from 'react';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';
import { AnalyticsArea } from '../../context/AnalyticsContext';
import { getCategoryImage } from '../../services/productImageService';
import { ProductImageData } from '../../services/productImageService';

interface SubCategoryGalleryProps {
  mainCategory: string;
  subCategories: string[];
  onSubCategorySelect: (subCategory: string) => void;
}

interface SubCategoryTileProps {
  mainCategory: string;
  subCategory: string;
  onSelect: () => void;
}

const SubCategoryTile: React.FC<SubCategoryTileProps> = ({ mainCategory, subCategory, onSelect }) => {
  const [imageData, setImageData] = useState<ProductImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Default placeholder image as base64 - gray background with subcategory text
  const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGMEYwRjAiLz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyKSIvPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhciIgeDE9IjIwMCIgeTE9IjAiIHgyPSIyMDAiIHkyPSIyMDAiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj48c3RvcCBzdG9wLWNvbG9yPSIjRjBGMEYwIiBzdG9wLW9wYWNpdHk9IjAiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1QTVBNUEiIHN0b3Atb3BhY2l0eT0iMC4yIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHRleHQgeD0iMjAwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNnB4IiBmaWxsPSIjNTU1NTU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIj5TdWJjYXRlZ29yeSBJbWFnZTwvdGV4dD48L3N2Zz4=';
  
  useEffect(() => {
    const fetchSubCategoryImage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to get image for the specific subcategory first
        let data = await getCategoryImage(subCategory, subCategory);
        
        // If that fails, try with the main category as a context
        if (!data || !data.url) {
          data = await getCategoryImage(subCategory, mainCategory);
        }
        
        setImageData(data);
      } catch (err) {
        console.error(`Error fetching image for subcategory ${subCategory}:`, err);
        setError('Failed to load image');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSubCategoryImage();
  }, [mainCategory, subCategory]);
  
  return (
    <div
      className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white h-full"
      onClick={onSelect}
      role="button"
      aria-label={`Select ${subCategory} subcategory`}
    >
      <div className="flex flex-col h-full">
        {/* Image container with fixed aspect ratio */}
        <div className="relative w-full pb-[50%] overflow-hidden bg-gray-100">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
              <span className="text-gray-400 text-sm">Loading...</span>
            </div>
          ) : (
            <img
              src={imageData?.url || placeholderImage}
              alt={`${subCategory}`}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                console.error(`Image failed to load for subcategory ${subCategory}`);
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite error loops
                target.src = placeholderImage;
              }}
            />
          )}
        </div>
        
        {/* Subcategory name */}
        <div className="p-4 flex-grow flex items-center justify-center text-center">
          <h3 className="text-gray-800 font-medium text-sm md:text-base">{subCategory}</h3>
        </div>
      </div>
    </div>
  );
};

const SubCategoryGallery: React.FC<SubCategoryGalleryProps> = ({ mainCategory, subCategories, onSubCategorySelect }) => {
  // Use component tracking
  const trackSubCategorySelect = useComponentTracking('products2' as AnalyticsArea, 'SubCategorySelect');
  
  const handleSubCategorySelect = (subCategory: string) => {
    trackSubCategorySelect('click', { mainCategory, subCategory });
    onSubCategorySelect(subCategory);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Browse {mainCategory}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {subCategories.map((subCategory) => (
          <SubCategoryTile
            key={subCategory}
            mainCategory={mainCategory}
            subCategory={subCategory}
            onSelect={() => handleSubCategorySelect(subCategory)}
          />
        ))}
      </div>
    </div>
  );
};

export default SubCategoryGallery;