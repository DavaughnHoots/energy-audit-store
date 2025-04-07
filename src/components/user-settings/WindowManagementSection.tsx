import React from 'react';
import { 
  UpdateWindowMaintenanceDto, 
  WindowMaintenance, 
  UpdateWeatherizationDto, 
  WeatherizationMonitoring, 
  Severity 
} from '@/types/propertySettings';

// Constants for window types
const WINDOW_TYPES = [
  { value: 'single', label: 'Single Pane' },
  { value: 'double', label: 'Double Pane' },
  { value: 'triple', label: 'Triple Pane' },
  { value: 'not-sure', label: 'Not Sure' }
];

const SEVERITY_OPTIONS: Severity[] = ['none', 'mild', 'moderate', 'severe'];

interface Props {
  windowData?: WindowMaintenance;
  weatherizationData?: WeatherizationMonitoring;
  onSaveWindow: (data: UpdateWindowMaintenanceDto) => Promise<void>;
  onSaveWeatherization: (data: UpdateWeatherizationDto) => Promise<void>;
}

/**
 * Unified Window Management Section
 * Combines window maintenance and window assessment functionality
 */
const WindowManagementSection: React.FC<Props> = ({ 
  windowData, 
  weatherizationData, 
  onSaveWindow, 
  onSaveWeatherization 
}) => {
  const [activeTab, setActiveTab] = React.useState<'details' | 'assessment'>('details');
  
  // Window maintenance state
  const [windowFormData, setWindowFormData] = React.useState<UpdateWindowMaintenanceDto>({
    windowCount: windowData?.windowCount || 0,
    windowType: windowData?.windowType || 'not-sure',
    lastReplacementDate: windowData?.lastReplacementDate || null,
    nextMaintenanceDate: windowData?.nextMaintenanceDate || null,
    maintenanceNotes: windowData?.maintenanceNotes || null
  });

  // Weatherization state
  const [weatherizationFormData, setWeatherizationFormData] = React.useState<UpdateWeatherizationDto>({
    inspectionDate: weatherizationData?.inspectionDate || new Date().toISOString().split('T')[0],
    condensationIssues: weatherizationData?.condensationIssues || { locations: [], severity: 'none' },
    draftLocations: weatherizationData?.draftLocations || { locations: [], severity: 'none' },
    notes: weatherizationData?.notes || null
  });

  // Window maintenance handlers
  const handleWindowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveWindow(windowFormData);
  };

  // Weatherization handlers
  const handleWeatherizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveWeatherization(weatherizationFormData);
  };

  const handleLocationChange = (
    type: 'condensationIssues' | 'draftLocations',
    field: 'locations' | 'severity',
    value: string | string[]
  ) => {
    setWeatherizationFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Window Management</h3>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'details'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Window Details
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'assessment'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('assessment')}
          >
            Window Assessment
          </button>
        </div>
      </div>

      {activeTab === 'details' ? (
        // Window Details Form
        <form onSubmit={handleWindowSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="windowCount" className="block text-sm font-medium text-gray-700">
                Number of Windows
              </label>
              <input
                type="number"
                id="windowCount"
                min={0}
                value={windowFormData.windowCount}
                onChange={(e) => setWindowFormData(prev => ({ ...prev, windowCount: parseInt(e.target.value) }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="windowType" className="block text-sm font-medium text-gray-700">
                Window Type
              </label>
              <select
                id="windowType"
                value={windowFormData.windowType || 'not-sure'}
                onChange={(e) => setWindowFormData(prev => ({ ...prev, windowType: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                {WINDOW_TYPES.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lastReplacement" className="block text-sm font-medium text-gray-700">
                Last Replacement Date
              </label>
              <input
                type="date"
                id="lastReplacement"
                value={windowFormData.lastReplacementDate || ''}
                onChange={(e) => setWindowFormData(prev => ({ ...prev, lastReplacementDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div>
              <label htmlFor="nextMaintenance" className="block text-sm font-medium text-gray-700">
                Next Maintenance Due
              </label>
              <input
                type="date"
                id="nextMaintenance"
                value={windowFormData.nextMaintenanceDate || ''}
                onChange={(e) => setWindowFormData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="maintenanceNotes" className="block text-sm font-medium text-gray-700">
              Maintenance Notes
            </label>
            <textarea
              id="maintenanceNotes"
              rows={3}
              value={windowFormData.maintenanceNotes || ''}
              onChange={(e) => setWindowFormData(prev => ({ ...prev, maintenanceNotes: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save Window Details
            </button>
          </div>
        </form>
      ) : (
        // Window Assessment Form
        <form onSubmit={handleWeatherizationSubmit} className="space-y-4">
          <div>
            <label htmlFor="inspectionDate" className="block text-sm font-medium text-gray-700">
              Inspection Date
            </label>
            <input
              type="date"
              id="inspectionDate"
              value={weatherizationFormData.inspectionDate}
              onChange={(e) => setWeatherizationFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          {/* Condensation Issues */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="text-md font-medium text-gray-900">Condensation Issues</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="condensationSeverity" className="block text-sm text-gray-700">
                  Severity
                </label>
                <select
                  id="condensationSeverity"
                  value={weatherizationFormData.condensationIssues?.severity}
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
                  value={weatherizationFormData.condensationIssues?.locations.join(', ')}
                  onChange={(e) => handleLocationChange('condensationIssues', 'locations', e.target.value.split(',').map(s => s.trim()))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Draft Locations */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="text-md font-medium text-gray-900">Draft Issues</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="draftSeverity" className="block text-sm text-gray-700">
                  Severity
                </label>
                <select
                  id="draftSeverity"
                  value={weatherizationFormData.draftLocations?.severity}
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
                  value={weatherizationFormData.draftLocations?.locations.join(', ')}
                  onChange={(e) => handleLocationChange('draftLocations', 'locations', e.target.value.split(',').map(s => s.trim()))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="assessmentNotes" className="block text-sm font-medium text-gray-700">
              Assessment Notes
            </label>
            <textarea
              id="assessmentNotes"
              rows={3}
              value={weatherizationFormData.notes || ''}
              onChange={(e) => setWeatherizationFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Save Assessment
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default WindowManagementSection;
