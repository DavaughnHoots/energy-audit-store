import React, { useState } from 'react';
import { CurrentConditions } from '../../../../backend/src/types/energyAudit';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { windowTypeDefaults, insulationConditionDefaults, windowConditionDefaults } from './conditionDefaults';

interface CurrentConditionsFormProps {
  data: CurrentConditions;
  onInputChange: (
    section: keyof CurrentConditions,
    field: string,
    value: string | number
  ) => void;
}

const CurrentConditionsForm: React.FC<CurrentConditionsFormProps> = ({
  data,
  onInputChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userModified, setUserModified] = useState<Record<string, boolean>>({});

  // Helper function to update a field if it hasn't been modified by the user
  const updateIfNotModified = (section: keyof CurrentConditions, field: string, value: any) => {
    const key = `${section}.${field}`;
    if (!userModified[key]) {
      onInputChange(section, field, value);
    }
  };

  // Handle basic field changes and update related advanced fields
  const handleBasicFieldChange = (section: keyof CurrentConditions, field: string, value: string) => {
    onInputChange(section, field, value);

    // Update advanced fields based on window type
    if (section === 'windowType') {
      const defaults = windowTypeDefaults[value as keyof typeof windowTypeDefaults];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          if (key === 'windowCondition') {
            updateIfNotModified('windowCondition', '', defaultValue);
          } else if (key === 'numWindows') {
            updateIfNotModified('numWindows', '', defaultValue);
          } else if (key === 'weatherStripping') {
            updateIfNotModified('weatherStripping', '', defaultValue);
          }
        });
      }
    }

    // Update advanced fields based on overall insulation condition
    if (section === 'insulation' && field === 'walls') {
      const defaults = insulationConditionDefaults[value as keyof typeof insulationConditionDefaults];
      if (defaults) {
        Object.entries(defaults.insulation).forEach(([area, condition]) => {
          updateIfNotModified('insulation', area, condition);
        });
      }
    }

    // Update advanced fields based on window condition
    if (section === 'windowCondition') {
      const defaults = windowConditionDefaults[value as keyof typeof windowConditionDefaults];
      if (defaults) {
        Object.entries(defaults).forEach(([key, defaultValue]) => {
          if (key === 'weatherStripping') {
            updateIfNotModified('weatherStripping', '', defaultValue);
          }
        });
      }
    }
  };

  // Handle advanced field changes
  const handleAdvancedFieldChange = (section: keyof CurrentConditions, field: string, value: string | number) => {
    const key = `${section}.${field}`;
    setUserModified(prev => ({ ...prev, [key]: true }));
    onInputChange(section, field, value);
  };

  const renderBasicInsulationSelect = (area: keyof typeof data.insulation) => (
    <div>
      <label
        htmlFor={`insulation-${area}`}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {area.charAt(0).toUpperCase() + area.slice(1)} Insulation
      </label>
      <select
        id={`insulation-${area}`}
        value={data.insulation[area]}
        onChange={(e) => handleAdvancedFieldChange('insulation', area, e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
      >
        <option value="">Select condition</option>
        <option value="good">Good - No noticeable issues</option>
        <option value="average">Average - Some minor issues</option>
        <option value="poor">Poor - Noticeable problems</option>
        <option value="not-sure">Not Sure</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Basic Questions Section */}
      <div className="space-y-6">
        <div>
          <label htmlFor="overallInsulation" className="block text-sm font-medium text-gray-700 mb-2">
            Overall Insulation Assessment *
          </label>
          <select
            id="overallInsulation"
            value={data.insulation.walls}
            onChange={(e) => handleBasicFieldChange('insulation', 'walls', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select overall condition</option>
            <option value="good">Good - No noticeable issues</option>
            <option value="average">Average - Some minor issues</option>
            <option value="poor">Poor - Noticeable problems</option>
            <option value="not-sure">Not Sure</option>
          </select>
        </div>

        <div>
          <label htmlFor="windowType" className="block text-sm font-medium text-gray-700 mb-2">
            Window Type *
          </label>
          <select
            id="windowType"
            value={data.windowType}
            onChange={(e) => handleBasicFieldChange('windowType', '', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select window type</option>
            <option value="single">Single Pane</option>
            <option value="double">Double Pane</option>
            <option value="triple">Triple Pane</option>
            <option value="not-sure">Not Sure</option>
          </select>
        </div>

        <div>
          <label htmlFor="windowCondition" className="block text-sm font-medium text-gray-700 mb-2">
            Overall Window Condition *
          </label>
          <select
            id="windowCondition"
            value={data.windowCondition}
            onChange={(e) => handleBasicFieldChange('windowCondition', '', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select condition</option>
            <option value="excellent">Excellent - Like new</option>
            <option value="good">Good - Minor wear</option>
            <option value="fair">Fair - Some issues</option>
            <option value="poor">Poor - Major issues</option>
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

          {/* Detailed Insulation Assessment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Detailed Insulation Assessment</h3>
            {renderBasicInsulationSelect('attic')}
            {renderBasicInsulationSelect('walls')}
            {renderBasicInsulationSelect('basement')}
            {renderBasicInsulationSelect('floor')}
          </div>

          <div>
            <label htmlFor="numWindows" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Windows
            </label>
            <input
              type="number"
              id="numWindows"
              value={data.numWindows}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 0) { // Ensure non-negative
                  handleAdvancedFieldChange('numWindows', '', value);
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Must be a non-negative number</p>
          </div>

          <div>
            <label htmlFor="weatherStripping" className="block text-sm font-medium text-gray-700 mb-2">
              Weather Stripping Type
            </label>
            <select
              id="weatherStripping"
              value={data.weatherStripping}
              onChange={(e) => handleAdvancedFieldChange('weatherStripping', '', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              <option value="not-sure">Not Sure</option>
              <option value="door-sweep">Door Sweep</option>
              <option value="foam">Foam</option>
              <option value="metal">Metal</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentConditionsForm;
