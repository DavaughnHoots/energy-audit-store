import React, { useState, useEffect } from 'react';
import { Save, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PROPERTY_TYPES = [
  { value: 'single-family', label: 'Single-family detached' },
  { value: 'townhouse', label: 'Townhouse/Rowhome' },
  { value: 'duplex', label: 'Duplex/Condo' },
  { value: 'mobile', label: 'Mobile home' }
];

const CONSTRUCTION_PERIODS = [
  { value: 'before-1940', label: 'Before 1940' },
  { value: '1940-1959', label: '1940-1959' },
  { value: '1960-1979', label: '1960-1979' },
  { value: '1980-1999', label: '1980-1999' },
  { value: '2000-2019', label: '2000-2019' },
  { value: '2020-newer', label: '2020 or newer' }
];

export default function UserSettingsForm() {
  const [formData, setFormData] = useState({
    propertyType: '',
    constructionPeriod: '',
    stories: '',
    squareFootage: '',
    ceilingHeight: '',
    foundation: '',
    atticType: '',
  });

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('userSettingsForm');
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  // Save form data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('userSettingsForm', JSON.stringify(formData));
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear any previous errors
  };

  const validateForm = () => {
    if (!formData.propertyType) {
      setError('Property type is required');
      return false;
    }
    if (!formData.constructionPeriod) {
      setError('Construction period is required');
      return false;
    }
    if (!formData.squareFootage || isNaN(formData.squareFootage)) {
      setError('Valid square footage is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user-settings/property', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add your auth headers here
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Clear localStorage after successful save
      localStorage.removeItem('userSettingsForm');
      
      // You might want to show a success message or redirect
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Property Information</h2>
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-gray-500 hover:text-gray-700"
          >
            <HelpCircle className="h-6 w-6" />
          </button>
        </div>

        {showHelp && (
          <Alert className="mb-6">
            <AlertDescription>
              This information helps us provide accurate energy efficiency recommendations
              based on your property's characteristics. All fields marked with * are required.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Property Type *
            </label>
            <select
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            >
              <option value="">Select property type</option>
              {PROPERTY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Construction Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Construction Period *
            </label>
            <select
              name="constructionPeriod"
              value={formData.constructionPeriod}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            >
              <option value="">Select construction period</option>
              {CONSTRUCTION_PERIODS.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Stories */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Number of Stories *
            </label>
            <input
              type="number"
              name="stories"
              value={formData.stories}
              onChange={handleInputChange}
              min="1"
              max="10"
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            />
          </div>

          {/* Square Footage */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Square Footage *
            </label>
            <input
              type="number"
              name="squareFootage"
              value={formData.squareFootage}
              onChange={handleInputChange}
              min="100"
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            />
          </div>

          {/* Foundation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Foundation Type
            </label>
            <select
              name="foundation"
              value={formData.foundation}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500"
            >
              <option value="">Select foundation type</option>
              <option value="basement">Full Basement</option>
              <option value="crawlspace">Crawl Space</option>
              <option value="slab">Slab on Grade</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </button>
            
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Progress'}
              </button>
              
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}