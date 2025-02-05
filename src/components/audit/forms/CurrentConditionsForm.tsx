import React from 'react';
import { CurrentConditions } from '../../../../backend/src/types/energyAudit';

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
  const conditionOptions = ['poor', 'average', 'good', 'excellent', 'not-sure'];

  const renderInsulationSelect = (area: keyof typeof data.insulation) => (
    <div>
      <label
        htmlFor={`insulation-${area}`}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {area.charAt(0).toUpperCase() + area.slice(1)} Insulation *
      </label>
      <select
        id={`insulation-${area}`}
        value={data.insulation[area]}
        onChange={(e) => onInputChange('insulation', area, e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
        required
      >
        <option value="">Select condition</option>
        {conditionOptions.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Insulation Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Insulation Assessment</h3>
        {renderInsulationSelect('attic')}
        {renderInsulationSelect('walls')}
        {renderInsulationSelect('basement')}
        {renderInsulationSelect('floor')}
      </div>

      {/* Windows Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Windows</h3>
        
        <div>
          <label htmlFor="windowType" className="block text-sm font-medium text-gray-700 mb-2">
            Window Type *
          </label>
          <select
            id="windowType"
            value={data.windowType}
            onChange={(e) => onInputChange('windowType', '', e.target.value)}
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
          <label htmlFor="numWindows" className="block text-sm font-medium text-gray-700 mb-2">
            Number of Windows *
          </label>
          <input
            type="number"
            id="numWindows"
            value={data.numWindows}
            onChange={(e) => onInputChange('numWindows', '', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            min="0"
            required
          />
        </div>

        <div>
          <label htmlFor="windowCondition" className="block text-sm font-medium text-gray-700 mb-2">
            Window Condition *
          </label>
          <select
            id="windowCondition"
            value={data.windowCondition}
            onChange={(e) => onInputChange('windowCondition', '', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            required
          >
            <option value="">Select condition</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>

      {/* Weather Stripping */}
      <div>
        <label htmlFor="weatherStripping" className="block text-sm font-medium text-gray-700 mb-2">
          Weather Stripping Type *
        </label>
        <select
          id="weatherStripping"
          value={data.weatherStripping}
          onChange={(e) => onInputChange('weatherStripping', '', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        >
          <option value="">Select type</option>
          <option value="door-sweep">Door Sweep</option>
          <option value="foam">Foam</option>
          <option value="metal">Metal</option>
          <option value="none">None</option>
          <option value="not-sure">Not Sure</option>
        </select>
      </div>
    </div>
  );
};

export default CurrentConditionsForm;
