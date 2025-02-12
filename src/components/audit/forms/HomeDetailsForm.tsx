import React, { useState, useEffect } from 'react';
import { HomeDetails } from '../../../../backend/src/types/energyAudit';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { homeTypeDefaults, constructionPeriodDefaults, sizeCategoryDefaults } from './defaultMappings';

interface HomeDetailsFormProps {
  data: HomeDetails;
  onInputChange: (field: keyof HomeDetails, value: string | number) => void;
}

type ConstructionPeriod = keyof typeof constructionPeriodDefaults;
type SizeCategory = keyof typeof sizeCategoryDefaults;

const HomeDetailsForm: React.FC<HomeDetailsFormProps> = ({ data, onInputChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userModified, setUserModified] = useState<Partial<Record<keyof HomeDetails, boolean>>>({});

  // Helper function to update a field if it hasn't been modified by the user
  const updateIfNotModified = (field: keyof HomeDetails, value: string | number) => {
    if (!userModified[field]) {
      onInputChange(field, value);
    }
  };

  // Handle basic field changes and update related advanced fields
  const handleBasicFieldChange = (field: keyof HomeDetails, value: string | number) => {
    // Validate numeric fields
    if (field === 'homeSize') {
      const size = typeof value === 'string' ? parseInt(value) : value;
      const validatedSize = validateHomeSize(size);
      // Update both homeSize and squareFootage
      onInputChange(field, validatedSize);
      onInputChange('squareFootage', validatedSize);
      value = validatedSize;
    } else if (field === 'yearBuilt') {
      const year = typeof value === 'string' ? parseInt(value) : value;
      value = validateYearBuilt(year);
      onInputChange(field, value);
    } else {
      onInputChange(field, value);
    }

    // Update advanced fields based on home type
    if (field === 'homeType' && typeof value === 'string') {
      const defaults = homeTypeDefaults[value as keyof typeof homeTypeDefaults];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          if (defaultValue !== undefined) {
            updateIfNotModified(key as keyof HomeDetails, defaultValue);
          }
        });
      }
    }

    // Update advanced fields based on construction period
    if (field === 'yearBuilt') {
      const period = getConstructionPeriod(value as number);
      const defaults = constructionPeriodDefaults[period as ConstructionPeriod];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          if (defaultValue !== undefined) {
            updateIfNotModified(key as keyof HomeDetails, defaultValue);
          }
        });
      }
    }

    // Update advanced fields based on size category
    if (field === 'homeSize') {
      const category = getSizeCategory(value as number);
      const defaults = sizeCategoryDefaults[category as SizeCategory];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          if (defaultValue !== undefined) {
            updateIfNotModified(key as keyof HomeDetails, defaultValue);
          }
        });
      }
    }
  };

  // Handle advanced field changes
  const handleAdvancedFieldChange = (field: keyof HomeDetails, value: string | number) => {
    let validatedValue = value;

    // Validate numeric fields
    if (field === 'numRooms') {
      const rooms = typeof value === 'string' ? parseInt(value) : value;
      validatedValue = validateNumRooms(rooms);
    } else if (field === 'numFloors') {
      const floors = typeof value === 'string' ? parseInt(value) : value;
      validatedValue = validateNumFloors(floors);
    } else if (field === 'wallLength') {
      const length = typeof value === 'string' ? parseInt(value) : value;
      validatedValue = validateWallDimension(length);
    } else if (field === 'wallWidth') {
      const width = typeof value === 'string' ? parseInt(value) : value;
      validatedValue = validateWallDimension(width);
    }

    setUserModified(prev => ({ ...prev, [field]: true }));
    onInputChange(field, validatedValue);
  };

  // Validation functions
  const validateNumRooms = (rooms: number): number => {
    if (rooms < 1) return 1;
    if (rooms > 100) return 100;
    return rooms;
  };

  const validateNumFloors = (floors: number): number => {
    if (floors < 1) return 1;
    if (floors > 100) return 100;
    return floors;
  };

  const validateYearBuilt = (year: number): number => {
    const currentYear = new Date().getFullYear();
    if (year < 1800) return 1800;
    if (year > currentYear) return currentYear;
    return year;
  };

  const validateWallDimension = (dimension: number): number => {
    if (dimension < 10) return 10;
    if (dimension > 200) return 200;
    return dimension;
  };

  return (
    <div className="space-y-6">
      {/* Basic Questions Section */}
      <div className="space-y-6">
        <div>
          <label htmlFor="homeType" className="block text-sm font-medium text-gray-700 mb-2">
            Home Type *
          </label>
          <select
            id="homeType"
            value={data.homeType}
            onChange={(e) => handleBasicFieldChange('homeType', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select home type</option>
            <option value="apartment">Apartment</option>
            <option value="single-family">Single Family</option>
            <option value="townhouse">Townhouse</option>
            <option value="duplex">Duplex</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-2">
            Construction Period *
          </label>
          <select
            id="yearBuilt"
            value={getConstructionPeriod(data.yearBuilt)}
            onChange={(e) => handleBasicFieldChange('yearBuilt', getYearFromPeriod(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select period</option>
            <option value="before-1980">Before 1980</option>
            <option value="1980-2000">1980-2000</option>
            <option value="after-2000">After 2000</option>
          </select>
        </div>

        <div>
          <label htmlFor="homeSize" className="block text-sm font-medium text-gray-700 mb-2">
            Size Category *
          </label>
          <select
            id="homeSize"
            value={getSizeCategory(data.homeSize)}
            onChange={(e) => handleBasicFieldChange('homeSize', getSizeValue(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select size</option>
            <option value="small">Small (under 1,500 sq ft)</option>
            <option value="medium">Medium (1,500-2,500 sq ft)</option>
            <option value="large">Large (over 2,500 sq ft)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Home size must be between 100 and 50,000 square feet</p>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="border-t pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 mr-2" />
          ) : (
            <ChevronDown className="h-4 w-4 mr-2" />
          )}
          {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>
      </div>

      {/* Advanced Questions Section */}
      {showAdvanced && (
        <div className="space-y-6 bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500 mb-4">
            Advanced options help us provide more accurate recommendations. 
            Default values are automatically set based on your basic selections, but you can modify them if needed.
          </div>

          <div>
            <label htmlFor="numFloors" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Stories *
            </label>
            <select
              id="numFloors"
              value={data.numFloors}
              onChange={(e) => handleAdvancedFieldChange('numFloors', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            >
              <option value="1">1 Story</option>
              <option value="2">2 Stories</option>
              <option value="3">3 Stories</option>
              <option value="4">4 Stories</option>
              <option value="5">5+ Stories</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">Must be between 1 and 100 stories</p>
          </div>

          <div>
            <label htmlFor="numRooms" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rooms *
            </label>
            <input
              type="number"
              id="numRooms"
              value={data.numRooms || 1}
              onChange={(e) => handleAdvancedFieldChange('numRooms', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="1"
              max="100"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Must be between 1 and 100 rooms</p>
          </div>

          <div>
            <label htmlFor="ceilingHeight" className="block text-sm font-medium text-gray-700 mb-2">
              Ceiling Height (ft)
            </label>
            <select
              id="ceilingHeight"
              value={data.ceilingHeight || 8}
              onChange={(e) => handleAdvancedFieldChange('ceilingHeight', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="8">8 feet (standard)</option>
              <option value="9">9 feet</option>
              <option value="10">10 feet</option>
              <option value="12">12 feet or higher</option>
            </select>
          </div>

          <div>
            <label htmlFor="basementType" className="block text-sm font-medium text-gray-700 mb-2">
              Foundation Configuration *
            </label>
            <select
              id="basementType"
              value={data.basementType}
              onChange={(e) => handleAdvancedFieldChange('basementType', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            >
              <option value="full">Full Basement</option>
              <option value="partial">Partial Basement</option>
              <option value="crawlspace">Crawl Space</option>
              <option value="slab">Slab on Grade</option>
              <option value="none">No Basement</option>
              <option value="other">Other</option>
            </select>
          </div>

          {data.basementType !== 'slab' && data.basementType !== 'none' && (
            <div>
              <label htmlFor="basementHeating" className="block text-sm font-medium text-gray-700 mb-2">
                Basement Heating
              </label>
              <select
                id="basementHeating"
                value={data.basementHeating || 'unheated'}
                onChange={(e) => handleAdvancedFieldChange('basementHeating', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="heated">Heated</option>
                <option value="unheated">Unheated</option>
                <option value="partial">Partially Heated</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="wallLength" className="block text-sm font-medium text-gray-700 mb-2">
              Approximate House Length (ft)
            </label>
            <input
              type="number"
              id="wallLength"
              value={data.wallLength || 40}
              onChange={(e) => handleAdvancedFieldChange('wallLength', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="10"
              max="200"
            />
          </div>

          <div>
            <label htmlFor="wallWidth" className="block text-sm font-medium text-gray-700 mb-2">
              Approximate House Width (ft)
            </label>
            <input
              type="number"
              id="wallWidth"
              value={data.wallWidth || 30}
              onChange={(e) => handleAdvancedFieldChange('wallWidth', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="10"
              max="200"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for construction period
const getConstructionPeriod = (year: number): ConstructionPeriod => {
  if (year < 1980) return 'before-1980';
  if (year <= 2000) return '1980-2000';
  return 'after-2000';
};

const getYearFromPeriod = (period: string): number => {
  switch (period) {
    case 'before-1980':
      return 1979;
    case '1980-2000':
      return 1990;
    case 'after-2000':
      return 2010;
    default:
      return new Date().getFullYear();
  }
};

// Helper functions for size category
const getSizeCategory = (size: number): SizeCategory => {
  if (size < 1500) return 'small';
  if (size <= 2500) return 'medium';
  return 'large';
};

// Ensure size value is within backend validation limits
const validateHomeSize = (size: number): number => {
  if (size < 100) return 100;
  if (size > 50000) return 50000;
  return size;
};

const getSizeValue = (category: string): number => {
  let size = 1500; // Default to a safe middle value
  switch (category) {
    case 'small':
      size = 1000; // Safe value within 100-50,000 range
      break;
    case 'medium':
      size = 2000; // Safe value within 100-50,000 range
      break;
    case 'large':
      size = 3000; // Safe value within 100-50,000 range
      break;
  }
  // Update squareFootage when size changes
  return validateHomeSize(size);
};

export default HomeDetailsForm;
