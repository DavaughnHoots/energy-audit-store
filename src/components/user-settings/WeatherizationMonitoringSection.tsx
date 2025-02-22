import React from 'react';
import { UpdateWeatherizationDto, WeatherizationMonitoring, Severity } from '@/types/propertySettings';

interface Props {
  data?: WeatherizationMonitoring;
  onSave: (data: UpdateWeatherizationDto) => Promise<void>;
}

const SEVERITY_OPTIONS: Severity[] = ['none', 'mild', 'moderate', 'severe'];

const WeatherizationMonitoringSection: React.FC<Props> = ({ data, onSave }) => {
  const [formData, setFormData] = React.useState<UpdateWeatherizationDto>({
    inspectionDate: data?.inspectionDate || new Date().toISOString().split('T')[0],
    condensationIssues: data?.condensationIssues || { locations: [], severity: 'none' },
    draftLocations: data?.draftLocations || { locations: [], severity: 'none' },
    notes: data?.notes || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleLocationChange = (
    type: 'condensationIssues' | 'draftLocations',
    field: 'locations' | 'severity',
    value: string | string[]
  ) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Weatherization Monitoring</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700">
            Inspection Date
          </label>
          <input
            type="date"
            id="inspectionDate"
            value={formData.inspectionDate}
            onChange={(e) => setFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        {/* Condensation Issues */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Condensation Issues</h4>
          <div>
            <label htmlFor="condensationSeverity" className="block text-sm text-gray-700">
              Severity
            </label>
            <select
              id="condensationSeverity"
              value={formData.condensationIssues?.severity}
              onChange={(e) => handleLocationChange('condensationIssues', 'severity', e.target.value as Severity)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              {SEVERITY_OPTIONS.map(severity => (
                <option key={severity} value={severity}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="condensationLocations" className="block text-sm text-gray-700">
              Locations (comma-separated)
            </label>
            <input
              type="text"
              id="condensationLocations"
              value={formData.condensationIssues?.locations.join(', ')}
              onChange={(e) => handleLocationChange('condensationIssues', 'locations', e.target.value.split(',').map(s => s.trim()))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Draft Locations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Draft Issues</h4>
          <div>
            <label htmlFor="draftSeverity" className="block text-sm text-gray-700">
              Severity
            </label>
            <select
              id="draftSeverity"
              value={formData.draftLocations?.severity}
              onChange={(e) => handleLocationChange('draftLocations', 'severity', e.target.value as Severity)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              {SEVERITY_OPTIONS.map(severity => (
                <option key={severity} value={severity}>
                  {severity.charAt(0).toUpperCase() + severity.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="draftLocations" className="block text-sm text-gray-700">
              Locations (comma-separated)
            </label>
            <input
              type="text"
              id="draftLocations"
              value={formData.draftLocations?.locations.join(', ')}
              onChange={(e) => handleLocationChange('draftLocations', 'locations', e.target.value.split(',').map(s => s.trim()))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default WeatherizationMonitoringSection;
