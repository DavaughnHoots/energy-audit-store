import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserProfileData } from '@/services/userProfileService.enhanced';

interface AuditSettingsProps {
  initialData?: Partial<UserProfileData>;
  onSave?: (data: any) => Promise<boolean>;
}

const AuditSettings: React.FC<AuditSettingsProps> = ({ initialData, onSave }) => {
  const [temperatureUnit, setTemperatureUnit] = useState<string>('fahrenheit');
  const [energyUnit, setEnergyUnit] = useState<string>('kwh');
  const [notifyOnRecommendations, setNotifyOnRecommendations] = useState<boolean>(true);
  const [showNAOptions, setShowNAOptions] = useState<boolean>(true);
  
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      // Prepare data to save
      const data = {
        temperatureUnit,
        energyUnit,
        notifyOnRecommendations,
        showNAOptions
      };
      
      // Call the provided save function
      if (onSave) {
        const success = await onSave(data);
        if (success) {
          setSuccess('Audit settings updated successfully');
        } else {
          throw new Error('Failed to update audit settings');
        }
      } else {
        // If no save function provided, just simulate success
        setSuccess('Audit settings updated successfully');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Energy Audit Preferences</h2>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Display Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature Unit
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-green-600"
                    value="fahrenheit"
                    checked={temperatureUnit === 'fahrenheit'}
                    onChange={() => setTemperatureUnit('fahrenheit')}
                  />
                  <span className="ml-2">Fahrenheit (°F)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-green-600"
                    value="celsius"
                    checked={temperatureUnit === 'celsius'}
                    onChange={() => setTemperatureUnit('celsius')}
                  />
                  <span className="ml-2">Celsius (°C)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Unit
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-green-600"
                    value="kwh"
                    checked={energyUnit === 'kwh'}
                    onChange={() => setEnergyUnit('kwh')}
                  />
                  <span className="ml-2">Kilowatt-hours (kWh)</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-4 w-4 text-green-600"
                    value="btu"
                    checked={energyUnit === 'btu'}
                    onChange={() => setEnergyUnit('btu')}
                  />
                  <span className="ml-2">British Thermal Units (BTU)</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Form Options</h3>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="show-na"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={showNAOptions}
                  onChange={(e) => setShowNAOptions(e.target.checked)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="show-na" className="font-medium text-gray-700">Show "Not Applicable" options</label>
                <p className="text-gray-500">Allow marking fields as not applicable when they don't apply to your property type</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notifications"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  checked={notifyOnRecommendations}
                  onChange={(e) => setNotifyOnRecommendations(e.target.checked)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notifications" className="font-medium text-gray-700">Notify me of new recommendations</label>
                <p className="text-gray-500">Receive notifications when there are new energy saving recommendations</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            onClick={() => {
              setTemperatureUnit('fahrenheit');
              setEnergyUnit('kwh');
              setNotifyOnRecommendations(true);
              setShowNAOptions(true);
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

export default AuditSettings;
