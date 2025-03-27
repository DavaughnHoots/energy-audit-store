import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updatePropertyDetails, UserProfileData } from '@/services/userProfileService.enhanced';

// Constants for form options
const PROPERTY_TYPES = [
  { value: 'single-family', label: 'Single-Family Home' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'condominium', label: 'Condominium' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'mobile-home', label: 'Mobile Home' },
  { value: 'duplex', label: 'Duplex' }
];

const OWNERSHIP_TYPES = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased/Rented' }
];

const WINDOW_TYPES = [
  { value: 'single', label: 'Single Pane' },
  { value: 'double', label: 'Double Pane' },
  { value: 'triple', label: 'Triple Pane' },
  { value: 'not-sure', label: 'Not Sure' }
];

const WATER_HEATER_TYPES = [
  { value: 'standard-tank', label: 'Standard Tank' },
  { value: 'tankless', label: 'Tankless' },
  { value: 'heat-pump', label: 'Heat Pump' },
  { value: 'solar', label: 'Solar' },
  { value: 'not-sure', label: 'Not Sure' }
];

interface PropertyDetailsFormProps {
  initialData?: Partial<UserProfileData>;
  onSave?: (success: boolean) => void;
}

const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({ initialData, onSave }) => {
  const [propertyType, setPropertyType] = useState(initialData?.propertyDetails?.propertyType || '');
  const [ownershipStatus, setOwnershipStatus] = useState(initialData?.propertyDetails?.ownershipStatus || '');
  const [squareFootage, setSquareFootage] = useState<number | ''>(initialData?.propertyDetails?.squareFootage || '');
  const [yearBuilt, setYearBuilt] = useState<number | ''>(initialData?.propertyDetails?.yearBuilt || '');
  const [windowCount, setWindowCount] = useState<number | ''>(initialData?.windowMaintenance?.windowCount || '');
  const [windowType, setWindowType] = useState(initialData?.windowMaintenance?.windowType || 'not-sure');
  const [waterHeaterType, setWaterHeaterType] = useState(initialData?.energySystems?.waterHeater?.type || 'not-sure');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Determine if property is an apartment for customized labels
  const isApartment = propertyType === 'apartment';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!propertyType) {
      setError('Property type is required');
      return;
    }
    
    if (!squareFootage || squareFootage <= 0) {
      setError('Please enter a valid square footage');
      return;
    }
    
    if (!yearBuilt || yearBuilt < 1800 || yearBuilt > new Date().getFullYear()) {
      setError('Please enter a valid year built');
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Create property details object from form values
      const propertyDetails = {
        propertyType,
        ownershipStatus,
        squareFootage: Number(squareFootage),
        yearBuilt: Number(yearBuilt),
        stories: initialData?.propertyDetails?.stories || 1,
        insulation: initialData?.propertyDetails?.insulation || {
          attic: 'not-sure',
          walls: 'not-sure',
          basement: 'not-sure',
          floor: 'not-sure'
        }
      };
      
      // Save property details
      const result = await updatePropertyDetails(propertyDetails);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update property details');
      }
      
      // TODO: Add API endpoints for saving window maintenance and energy systems
      
      setSuccess('Property details updated successfully');
      if (onSave) {
        onSave(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
      if (onSave) {
        onSave(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Property Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm"
                required
              >
                <option value="">Select property type</option>
                {PROPERTY_TYPES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ownership Status
              </label>
              <select
                value={ownershipStatus}
                onChange={(e) => setOwnershipStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm"
              >
                <option value="">Select ownership status</option>
                {OWNERSHIP_TYPES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year Built
              </label>
              <input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isApartment ? 'Apartment Square Footage' : 'Home Square Footage'}
              </label>
              <input
                type="number"
                min="1"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Windows</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Window Type
              </label>
              <select
                value={windowType}
                onChange={(e) => setWindowType(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm"
              >
                {WINDOW_TYPES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Windows in {isApartment ? 'Apartment' : 'Home'}
              </label>
              <input
                type="number"
                min="0"
                value={windowCount}
                onChange={(e) => setWindowCount(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Water Heating System</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Water Heater Type
              </label>
              <select
                value={waterHeaterType}
                onChange={(e) => setWaterHeaterType(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm"
              >
                {WATER_HEATER_TYPES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            onClick={() => {
              setPropertyType(initialData?.propertyDetails?.propertyType || '');
              setSquareFootage(initialData?.propertyDetails?.squareFootage || '');
              setYearBuilt(initialData?.propertyDetails?.yearBuilt || '');
              setOwnershipStatus(initialData?.propertyDetails?.ownershipStatus || '');
              setWindowCount(initialData?.windowMaintenance?.windowCount || '');
              setWindowType(initialData?.windowMaintenance?.windowType || 'not-sure');
              setWaterHeaterType(initialData?.energySystems?.waterHeater?.type || 'not-sure');
              setError('');
              setSuccess('');
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyDetailsForm;
