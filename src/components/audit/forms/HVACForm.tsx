import React from 'react';
import { HeatingCooling } from '../../../../backend/src/types/energyAudit';

interface HVACFormProps {
  data: HeatingCooling;
  onInputChange: (
    section: 'heatingSystem' | 'coolingSystem',
    field: string,
    value: string | number
  ) => void;
}

const HVACForm: React.FC<HVACFormProps> = ({ data, onInputChange }) => {
  return (
    <div className="space-y-6">
      {/* Heating System */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Heating System</h3>
        
        <div>
          <label htmlFor="heatingType" className="block text-sm font-medium text-gray-700 mb-2">
            Heating System Type *
          </label>
          <select
            id="heatingType"
            value={data.heatingSystem.type}
            onChange={(e) => onInputChange('heatingSystem', 'type', e.target.value)}
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
          <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-2">
            Fuel Type *
          </label>
          <select
            id="fuelType"
            value={data.heatingSystem.fuelType}
            onChange={(e) => onInputChange('heatingSystem', 'fuelType', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select fuel type</option>
            <option value="natural-gas">Natural Gas</option>
            <option value="oil">Oil</option>
            <option value="electric">Electric</option>
            <option value="propane">Propane</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="heatingAge" className="block text-sm font-medium text-gray-700 mb-2">
            System Age (years) *
          </label>
          <input
            type="number"
            id="heatingAge"
            value={data.heatingSystem.age}
            onChange={(e) => onInputChange('heatingSystem', 'age', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            min="0"
            max="100"
            required
          />
        </div>

        <div>
          <label htmlFor="lastService" className="block text-sm font-medium text-gray-700 mb-2">
            Last Service Date *
          </label>
          <input
            type="date"
            id="lastService"
            value={data.heatingSystem.lastService}
            onChange={(e) => onInputChange('heatingSystem', 'lastService', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>
      </div>

      {/* Cooling System */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Cooling System</h3>
        
        <div>
          <label htmlFor="coolingType" className="block text-sm font-medium text-gray-700 mb-2">
            Cooling System Type *
          </label>
          <select
            id="coolingType"
            value={data.coolingSystem.type}
            onChange={(e) => onInputChange('coolingSystem', 'type', e.target.value)}
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

        {data.coolingSystem.type !== 'none' && (
          <div>
            <label htmlFor="coolingAge" className="block text-sm font-medium text-gray-700 mb-2">
              System Age (years) *
            </label>
            <input
              type="number"
              id="coolingAge"
              value={data.coolingSystem.age}
              onChange={(e) => onInputChange('coolingSystem', 'age', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
              max="100"
              required
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HVACForm;
