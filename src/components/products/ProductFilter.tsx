import React from 'react';
import { Sliders } from 'lucide-react';

interface Category {
  main: string[];
  sub: { [key: string]: string[] };
}

import { ProductFilters } from '../../../backend/src/types/product';

interface ProductFilterProps {
  categories: Category;
  filters: ProductFilters;
  onFilterChange: (filterName: string, value: string) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  filters,
  onFilterChange
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">Filters</h2>
        <div className="flex items-center text-sm text-gray-500">
          <Sliders className="h-4 w-4 mr-1" />
          <span>Refine Results</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.mainCategory}
            onChange={(e) => onFilterChange('mainCategory', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.main.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Sub-Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sub-Category
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.subCategory}
            onChange={(e) => onFilterChange('subCategory', e.target.value)}
            disabled={!filters.mainCategory}
          >
            <option value="">All Sub-Categories</option>
            {filters.mainCategory && categories.sub[filters.mainCategory]?.map((subCategory) => (
              <option key={subCategory} value={subCategory}>{subCategory}</option>
            ))}
          </select>
        </div>

        {/* Energy Rating Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Energy Rating
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            value={filters.energyRating || ''}
            onChange={(e) => onFilterChange('energyRating', e.target.value)}
          >
            <option value="">Any Rating</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        {/* Price Range Filter - This is just a UI mockup, we'd need to implement the actual functionality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Range
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
            />
          </div>
        </div>

        {/* Apply Filters Button */}
        <button
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 mt-2"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default ProductFilter;
