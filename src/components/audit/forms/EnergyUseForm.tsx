import React from 'react';
import { EnergyConsumption } from '../../../../backend/src/types/energyAudit';

interface EnergyUseFormProps {
  data: EnergyConsumption;
  onInputChange: (field: keyof EnergyConsumption, subfield: string, value: any) => void;
}

const EnergyUseForm: React.FC<EnergyUseFormProps> = ({ data, onInputChange }) => {
  const timeRanges = ['0-6', '7-12', '13-18', '19-24'];
  const peakTimes = [
    'Morning (6am-12pm)',
    'Afternoon (12pm-6pm)',
    'Evening (6pm-12am)',
    'Night (12am-6am)',
  ];

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="powerConsumption" className="block text-sm font-medium text-gray-700 mb-2">
          Power Consumption (kW) *
        </label>
        <select
          id="powerConsumption"
          value={data.powerConsumption}
          onChange={(e) => onInputChange('powerConsumption', '', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        >
          <option value="">Select consumption range</option>
          <option value="0-2kW">0-2 kW</option>
          <option value="2-4kW">2-4 kW</option>
          <option value="4-6kW">4-6 kW</option>
          <option value="6-8kW">6-8 kW</option>
          <option value="8+kW">8+ kW</option>
        </select>
      </div>

      {/* Occupancy Hours */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Occupancy Hours</h3>
        
        <div>
          <label htmlFor="weekdayHours" className="block text-sm font-medium text-gray-700 mb-2">
            Weekday Hours *
          </label>
          <select
            id="weekdayHours"
            value={data.occupancyHours.weekdays}
            onChange={(e) => onInputChange('occupancyHours', 'weekdays', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select hours</option>
            {timeRanges.map((range) => (
              <option key={range} value={range}>
                {range} hours
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="weekendHours" className="block text-sm font-medium text-gray-700 mb-2">
            Weekend Hours *
          </label>
          <select
            id="weekendHours"
            value={data.occupancyHours.weekends}
            onChange={(e) => onInputChange('occupancyHours', 'weekends', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select hours</option>
            {timeRanges.map((range) => (
              <option key={range} value={range}>
                {range} hours
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="season" className="block text-sm font-medium text-gray-700 mb-2">
          Current Season *
        </label>
        <select
          id="season"
          value={data.season}
          onChange={(e) => onInputChange('season', '', e.target.value)}
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
          Occupancy Pattern *
        </label>
        <input
          type="text"
          id="occupancyPattern"
          value={data.occupancyPattern}
          onChange={(e) => onInputChange('occupancyPattern', '', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="e.g., Work from home, Regular 9-5, etc."
          required
        />
      </div>

      <div>
        <label htmlFor="monthlyBill" className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Energy Bill ($) *
        </label>
        <input
          type="number"
          id="monthlyBill"
          value={data.monthlyBill}
          onChange={(e) => onInputChange('monthlyBill', '', parseFloat(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Peak Usage Times *
        </label>
        <div className="space-y-2">
          {peakTimes.map((time) => (
            <label key={time} className="flex items-center">
              <input
                type="checkbox"
                checked={data.peakUsageTimes.includes(time)}
                onChange={(e) => {
                  const newPeakTimes = e.target.checked
                    ? [...data.peakUsageTimes, time]
                    : data.peakUsageTimes.filter((t) => t !== time);
                  onInputChange('peakUsageTimes', '', newPeakTimes);
                }}
                className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-600">{time}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnergyUseForm;
