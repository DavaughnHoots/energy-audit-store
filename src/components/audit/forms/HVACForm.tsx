import React, { useState } from 'react';
import { HeatingCooling } from '../../../../backend/src/types/energyAudit';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { heatingSystemDefaults, fuelTypeDefaults, coolingSystemDefaults } from './hvacDefaults';

interface HVACFormProps {
  data: HeatingCooling;
  onInputChange: (
    section: 'heatingSystem' | 'coolingSystem',
    field: string,
    value: string | number
  ) => void;
}

const HVACForm: React.FC<HVACFormProps> = ({ data, onInputChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userModified, setUserModified] = useState<Record<string, boolean>>({});
  const today = new Date().toISOString().split('T')[0];

  // Helper function to update a field if it hasn't been modified by the user
  const updateIfNotModified = (section: 'heatingSystem' | 'coolingSystem', field: string, value: any) => {
    const key = `${section}.${field}`;
    if (!userModified[key]) {
      onInputChange(section, field, value);
    }
  };

  // Handle basic field changes and update related advanced fields
  const handleBasicFieldChange = (section: 'heatingSystem' | 'coolingSystem', field: string, value: string) => {
    onInputChange(section, field, value);

    // Update advanced fields based on heating system type
    if (section === 'heatingSystem' && field === 'type') {
      const defaults = heatingSystemDefaults[value as keyof typeof heatingSystemDefaults];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          updateIfNotModified('heatingSystem', key, defaultValue);
        });
      }
    }

    // Update advanced fields based on fuel type
    if (section === 'heatingSystem' && field === 'fuelType') {
      const defaults = fuelTypeDefaults[value as keyof typeof fuelTypeDefaults];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          updateIfNotModified('heatingSystem', key, defaultValue);
        });
      }
    }

    // Update advanced fields based on cooling system type
    if (section === 'coolingSystem' && field === 'type') {
      const defaults = coolingSystemDefaults[value as keyof typeof coolingSystemDefaults];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          updateIfNotModified('coolingSystem', key, defaultValue);
        });
      }
    }
  };

  // Handle advanced field changes
  const handleAdvancedFieldChange = (section: 'heatingSystem' | 'coolingSystem', field: string, value: string | number) => {
    const key = `${section}.${field}`;
    setUserModified(prev => ({ ...prev, [key]: true }));
    onInputChange(section, field, value);
  };

  return (
    <div className="space-y-6">
      {/* Basic Questions Section */}
      <div className="space-y-6">
        <div>
          <label htmlFor="heatingType" className="block text-sm font-medium text-gray-700 mb-2">
            Primary Heating System *
          </label>
          <select
            id="heatingType"
            value={data.heatingSystem.type}
            onChange={(e) => handleBasicFieldChange('heatingSystem', 'type', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select type</option>
            <option value="furnace">Furnace</option>
            <option value="boiler">Boiler</option>
            <option value="heat-pump">Heat Pump</option>
            <option value="electric-baseboard">Electric Baseboard</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="coolingType" className="block text-sm font-medium text-gray-700 mb-2">
            Primary Cooling System *
          </label>
          <select
            id="coolingType"
            value={data.coolingSystem.type}
            onChange={(e) => handleBasicFieldChange('coolingSystem', 'type', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select type</option>
            <option value="central">Central Air</option>
            <option value="window-unit">Window Units</option>
            <option value="portable">Portable Units</option>
            <option value="none">None</option>
          </select>
        </div>

        <div>
          <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-2">
            Primary Heating Fuel *
          </label>
          <select
            id="fuelType"
            value={data.heatingSystem.fuelType}
            onChange={(e) => handleBasicFieldChange('heatingSystem', 'fuelType', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select fuel type</option>
            <option value="natural-gas">Natural Gas</option>
            <option value="electric">Electric</option>
            <option value="oil">Oil</option>
            <option value="propane">Propane</option>
            <option value="other">Other</option>
          </select>
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

          {/* Heating System Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Heating System Details</h3>
            
            <div>
              <label htmlFor="heatingAge" className="block text-sm font-medium text-gray-700 mb-2">
                System Age (years)
              </label>
              <input
                type="number"
                id="heatingAge"
                value={data.heatingSystem.age}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value >= 0 && value <= 100) {
                    handleAdvancedFieldChange('heatingSystem', 'age', value);
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                min="0"
                max="100"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Must be between 0 and 100 years</p>
            </div>

            <div>
              <label htmlFor="lastService" className="block text-sm font-medium text-gray-700 mb-2">
                Last Service Date
              </label>
              <input
                type="date"
                id="lastService"
                value={data.heatingSystem.lastService || today}
                onChange={(e) => handleAdvancedFieldChange('heatingSystem', 'lastService', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Cooling System Details */}
          {data.coolingSystem.type !== 'none' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cooling System Details</h3>
              
              <div>
                <label htmlFor="coolingAge" className="block text-sm font-medium text-gray-700 mb-2">
                  System Age (years)
                </label>
                  <input
                    type="number"
                    id="coolingAge"
                    value={data.coolingSystem.age}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 0 && value <= 100) {
                        handleAdvancedFieldChange('coolingSystem', 'age', value);
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    min="0"
                    max="100"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">Must be between 0 and 100 years</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HVACForm;
