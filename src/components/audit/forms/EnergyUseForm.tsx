import React, { useState } from 'react';
import { EnergyConsumption } from '../../../../backend/src/types/energyAudit';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { occupancyPatternDefaults, seasonDefaults, monthlyBillDefaults, getBillCategory } from './energyDefaults';

interface EnergyUseFormProps {
  data: EnergyConsumption;
  onInputChange: (field: keyof EnergyConsumption, subfield: string, value: any) => void;
}

const EnergyUseForm: React.FC<EnergyUseFormProps> = ({ data, onInputChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userModified, setUserModified] = useState<Record<string, boolean>>({});

  // Helper function to update a field if it hasn't been modified by the user
  const updateIfNotModified = (field: keyof EnergyConsumption, subfield: string, value: any) => {
    const key = `${field}.${subfield}`;
    if (!userModified[key]) {
      onInputChange(field, subfield, value);
    }
  };

  // Handle basic field changes and update related advanced fields
  const handleBasicFieldChange = (field: keyof EnergyConsumption, subfield: string, value: any) => {
    // Validate occupancy pattern length
    if (field === 'occupancyPattern' && typeof value === 'string') {
      if (value.length < 3 || value.length > 200) {
        return;
      }
    }

    onInputChange(field, subfield, value);

    // Update advanced fields based on occupancy pattern
    if (field === 'occupancyPattern') {
      const defaults = occupancyPatternDefaults[value as keyof typeof occupancyPatternDefaults];
      if (defaults) {
        updateIfNotModified('powerConsumption', '', defaults.powerConsumption);
        updateIfNotModified('occupancyHours', 'weekdays', defaults.occupancyHours.weekdays);
        updateIfNotModified('occupancyHours', 'weekends', defaults.occupancyHours.weekends);
        updateIfNotModified('peakUsageTimes', '', defaults.peakUsageTimes);
      }
    }

    // Update advanced fields based on season
    if (field === 'season') {
      const defaults = seasonDefaults[value as keyof typeof seasonDefaults];
      if (defaults) {
        updateIfNotModified('powerConsumption', '', defaults.powerConsumption);
        updateIfNotModified('peakUsageTimes', '', defaults.peakUsageTimes);
      }
    }

    // Update advanced fields based on monthly bill
    if (field === 'monthlyBill') {
      const category = getBillCategory(value);
      const defaults = monthlyBillDefaults[category];
      if (defaults) {
        updateIfNotModified('powerConsumption', '', defaults.powerConsumption);
        updateIfNotModified('peakUsageTimes', '', defaults.peakUsageTimes);
      }
    }
  };

  // Handle advanced field changes
  const handleAdvancedFieldChange = (field: keyof EnergyConsumption, subfield: string, value: any) => {
    const key = `${field}.${subfield}`;
    setUserModified(prev => ({ ...prev, [key]: true }));
    onInputChange(field, subfield, value);
  };

  return (
    <div className="space-y-6">
      {/* Basic Questions Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="electricBill" className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Electric Usage (kWh) *
            </label>
            <input
              type="number"
              id="electricBill"
              value={data.electricBill}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value >= 0 && value <= 10000) {
                  handleBasicFieldChange('electricBill', '', value);
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
              max="10000"
              step="1"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Enter average monthly electricity usage</p>
          </div>

          <div>
            <label htmlFor="gasBill" className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Gas Usage (therms) *
            </label>
            <input
              type="number"
              id="gasBill"
              value={data.gasBill}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value >= 0 && value <= 1000) {
                  handleBasicFieldChange('gasBill', '', value);
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
              max="1000"
              step="1"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Enter average monthly gas usage</p>
          </div>
        </div>

        <div>
          <label htmlFor="monthlyBill" className="block text-sm font-medium text-gray-700 mb-2">
            Total Monthly Energy Bill ($) *
          </label>
          <input
            type="number"
            id="monthlyBill"
            value={data.monthlyBill}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value > 0 && value <= 10000) {
                handleBasicFieldChange('monthlyBill', '', value);
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            min="0.01"
            max="10000"
            step="0.01"
            required
          />
          <p className="mt-1 text-sm text-gray-500">Must be between $0.01 and $10,000</p>
        </div>

        <div>
          <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
            Current Season *
          </label>
          <select
            id="season"
            value={data.season}
            onChange={(e) => handleBasicFieldChange('season', '', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select season</option>
            <option value="mild-winter">Mild Winter</option>
            <option value="moderate-winter">Moderate Winter</option>
            <option value="mild-summer">Mild Summer</option>
            <option value="moderate-summer">Moderate Summer</option>
            <option value="peak-summer">Peak Summer</option>
            <option value="spring-fall">Spring/Fall</option>
          </select>
        </div>

        <div>
          <label htmlFor="occupancyPattern" className="block text-sm font-medium text-gray-700 mb-2">
            Basic Occupancy Pattern *
          </label>
          <select
            id="occupancyPattern"
            value={data.occupancyPattern}
            onChange={(e) => handleBasicFieldChange('occupancyPattern', '', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select pattern</option>
            <option value="home-all-day">Home All Day</option>
            <option value="work-hours">Away During Work Hours</option>
            <option value="evenings-weekends">Evenings and Weekends Only</option>
            <option value="variable">Variable Schedule</option>
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

          <div>
            <label htmlFor="powerConsumption" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Power Consumption *
            </label>
            <select
              id="powerConsumption"
              value={data.powerConsumption}
              onChange={(e) => {
                const value = e.target.value;
                // Validate format X-YkW
                if (value === '' || /^\d+-\d+kW$/.test(value)) {
                  handleAdvancedFieldChange('powerConsumption', '', value);
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              required
            >
              <option value="">Select consumption range</option>
              <option value="0-2kW">Low (0-2 kW)</option>
              <option value="2-4kW">Medium (2-4 kW)</option>
              <option value="4-6kW">High (4-6 kW)</option>
              <option value="6-8kW">Very High (6-8 kW)</option>
              <option value="8-10kW">Exceptional (8-10 kW)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">Must be in format "X-YkW"</p>
          </div>

          {/* Detailed Occupancy Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Detailed Occupancy Hours</h3>
            
            <div>
              <label htmlFor="weekdayHours" className="block text-sm font-medium text-gray-700 mb-2">
                Typical Weekday Hours at Home *
              </label>
              <select
                id="weekdayHours"
                value={data.occupancyHours.weekdays}
                onChange={(e) => handleAdvancedFieldChange('occupancyHours', 'weekdays', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              >
                <option value="0-6">0-6 hours</option>
                <option value="7-12">7-12 hours</option>
                <option value="13-18">13-18 hours</option>
                <option value="19-24">19-24 hours</option>
              </select>
            </div>

            <div>
              <label htmlFor="weekendHours" className="block text-sm font-medium text-gray-700 mb-2">
                Typical Weekend Hours at Home *
              </label>
              <select
                id="weekendHours"
                value={data.occupancyHours.weekends}
                onChange={(e) => handleAdvancedFieldChange('occupancyHours', 'weekends', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              >
                <option value="0-6">0-6 hours</option>
                <option value="7-12">7-12 hours</option>
                <option value="13-18">13-18 hours</option>
                <option value="19-24">19-24 hours</option>
              </select>
            </div>
          </div>

          {/* Peak Usage Times */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Peak Energy Usage Times *
            </label>
            <div className="space-y-2">
              {[
                'Morning (6am-12pm)',
                'Afternoon (12pm-6pm)',
                'Evening (6pm-12am)',
                'Night (12am-6am)'
              ].map((time) => (
                <label key={time} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.peakUsageTimes.includes(time)}
                    onChange={(e) => {
                      const newPeakTimes = e.target.checked
                        ? [...data.peakUsageTimes, time]
                        : data.peakUsageTimes.filter((t) => t !== time);
                      // Validate min 1, max 24 peak times
                      if (newPeakTimes.length >= 1 && newPeakTimes.length <= 24) {
                        handleAdvancedFieldChange('peakUsageTimes', '', newPeakTimes);
                      }
                    }}
                    className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">{time}</span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-sm text-gray-500">Must select at least one peak usage time</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyUseForm;
