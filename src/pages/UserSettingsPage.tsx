import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '../components/ui/alert';
import HomeConditionsSection from '../components/user-settings/HomeConditionsSection';
import WindowMaintenanceSection from '../components/user-settings/WindowMaintenanceSection';
import WeatherizationMonitoringSection from '../components/user-settings/WeatherizationMonitoringSection';
import { API_ENDPOINTS, getApiUrl } from '../config/api';
import { fetchWithAuth, getAuthHeaders } from '../utils/authUtils';
import { WindowMaintenance, WeatherizationMonitoring, UpdateWindowMaintenanceDto, UpdateWeatherizationDto } from '../types/propertySettings';
import { usePageTracking } from '../hooks/analytics/usePageTracking';
import { useComponentTracking } from '../hooks/analytics/useComponentTracking';

interface Props {
  initialSection?: 'property' | 'general';
}

const UserSettingsPage: React.FC<Props> = ({ initialSection = 'general' }) => {
  // Add analytics page tracking
  usePageTracking('settings');
  
  // Add component tracking for interactive elements
  const trackComponentEvent = useComponentTracking('settings', 'UserSettingsPage');
  
  const [activeSection, setActiveSection] = useState(initialSection);
  const [settings, setSettings] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    emailNotifications: true,
    theme: 'light'
  });

  const [windowData, setWindowData] = useState<WindowMaintenance | undefined>(undefined);
  const [weatherizationData, setWeatherizationData] = useState<WeatherizationMonitoring | undefined>(undefined);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchWindowData();
    fetchWeatherizationData();
  }, []);

  useEffect(() => {
    setActiveSection(initialSection);
    // Track which section is being viewed
    trackComponentEvent('view_section', { section: initialSection });
  }, [initialSection, trackComponentEvent]);

  const fetchWindowData = async () => {
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.SETTINGS.WINDOWS);

      if (!response.ok) throw new Error('Failed to fetch window data');

      const data = await response.json();
      setWindowData(data);
    } catch (err) {
      console.error('Window data fetch error:', err);
      setError('Failed to load window maintenance data');
    }
  };

  const fetchWeatherizationData = async () => {
    try {
      const response = await fetchWithAuth(API_ENDPOINTS.SETTINGS.WEATHERIZATION);

      if (!response.ok) throw new Error('Failed to fetch weatherization data');

      const data = await response.json();
      setWeatherizationData(data);
    } catch (err) {
      console.error('Weatherization data fetch error:', err);
      setError('Failed to load weatherization data');
    }
  };

  const handleSaveWindowData = async (data: UpdateWindowMaintenanceDto) => {
    try {
      // Track the attempt to save window data
      trackComponentEvent('save_window_data', { dataSize: Object.keys(data).length });
      
      const response = await fetchWithAuth(API_ENDPOINTS.SETTINGS.WINDOWS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save window data');

      const updatedData = await response.json();
      setWindowData(updatedData);
      setSuccess('Window maintenance data saved successfully');
      
      // Track successful save
      trackComponentEvent('save_window_data_success');
    } catch (err) {
      console.error('Window data save error:', err);
      setError('Failed to save window maintenance data');
    }
  };

  const handleSaveWeatherizationData = async (data: UpdateWeatherizationDto) => {
    try {
      // Track attempt to save weatherization data
      trackComponentEvent('save_weatherization_data', { dataSize: Object.keys(data).length });
      
      const response = await fetchWithAuth(API_ENDPOINTS.SETTINGS.WEATHERIZATION, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save weatherization data');

      const updatedData = await response.json();
      setWeatherizationData(updatedData);
      setSuccess('Weatherization data saved successfully');
      
      // Track successful save
      trackComponentEvent('save_weatherization_data_success');
    } catch (err) {
      console.error('Weatherization data save error:', err);
      setError('Failed to save weatherization data');
    }
  };

  const handleSaveHomeConditions = async (data: any) => {
    try {
      // Track attempt to save home conditions
      trackComponentEvent('save_home_conditions', { dataSize: Object.keys(data).length });
      
      const response = await fetchWithAuth(API_ENDPOINTS.SETTINGS.PROPERTY, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to save property details');

      setSuccess('Property details saved successfully');
      
      // Track successful save
      trackComponentEvent('save_home_conditions_success');
      return response.json();
    } catch (err) {
      console.error('Property details save error:', err);
      setError('Failed to save property details');
      throw err;
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetchWithAuth(`${API_ENDPOINTS.AUTH.PROFILE}`);
      
      if (!response.ok) throw new Error('Failed to fetch settings');
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('Settings fetch error:', err);
      setError('Failed to load settings');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      const { name, checked } = e.target;
      setSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      const { name, value } = e.target;
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Track attempt to update general settings
      trackComponentEvent('update_general_settings');
      
      const response = await fetchWithAuth(`${API_ENDPOINTS.AUTH.PROFILE}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Settings update failed:', response.status, errorData);
        
        // Track failure
        trackComponentEvent('update_general_settings_error', { 
          status: response.status,
          error: errorData.message || 'Unknown error'
        });
        
        throw new Error(errorData.message || 'Failed to update settings');
      }

      setSuccess('Settings updated successfully');
      
      // Track success
      trackComponentEvent('update_general_settings_success');
    } catch (err) {
      console.error('Settings update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // Track data export attempt
      trackComponentEvent('export_data');
      
      const response = await fetchWithAuth(`${API_ENDPOINTS.AUTH.PROFILE}/export`);

      if (!response.ok) throw new Error('Failed to export data');

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-data.json';
      a.click();
      
      // Track successful export
      trackComponentEvent('export_data_success', { dataSize: JSON.stringify(data).length });
    } catch (err) {
      console.error('Export data error:', err);
      setError('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Track account deletion attempt
      trackComponentEvent('delete_account_attempt');
      
      const response = await fetchWithAuth(`${API_ENDPOINTS.AUTH.PROFILE}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: deletePassword })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Delete account failed:', response.status, errorData);
        
        // Track failure
        trackComponentEvent('delete_account_error', { 
          status: response.status,
          error: errorData.message || 'Unknown error'
        });
        
        throw new Error(errorData.message || 'Failed to delete account');
      }

      // Track successful deletion before clearing localStorage
      trackComponentEvent('delete_account_success');
      
      localStorage.clear();
      window.location.href = '/';
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => {
                setActiveSection('general');
                trackComponentEvent('switch_tab', { tab: 'general' });
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'general'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General Settings
            </button>
            <button
              onClick={() => {
                setActiveSection('property');
                trackComponentEvent('switch_tab', { tab: 'property' });
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'property'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Property Details
            </button>
          </nav>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {activeSection === 'general' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={settings.fullName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={settings.email}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={settings.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={settings.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                  Receive email notifications
                </label>
              </div>

              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                  Theme
                </label>
                <select
                  id="theme"
                  name="theme"
                  value={settings.theme}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleExportData}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Export Data
                </button>
              </div>
            </form>

            <div className="mt-12 border-t pt-6">
              <h2 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex justify-center py-2 px-4 border border-red-600 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Please enter your password to confirm account deletion. This action cannot be undone.
                  </p>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter password"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  />
                  <div className="flex space-x-4">
                    <button
                      onClick={handleDeleteAccount}
                      className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Confirm Deletion
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeletePassword('');
                      }}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'property' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <HomeConditionsSection onSave={handleSaveHomeConditions} />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <WindowMaintenanceSection
                data={windowData}
                onSave={handleSaveWindowData}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <WeatherizationMonitoringSection
                data={weatherizationData}
                onSave={handleSaveWeatherizationData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettingsPage;
