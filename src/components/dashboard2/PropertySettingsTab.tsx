import React, { useState, useEffect } from 'react';
import { Cog, AlertCircle, Save, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import PropertyDetailsForm from '@/components/user-settings/PropertyDetailsForm';
import HomeConditionsSection from '@/components/user-settings/HomeConditionsSection';
import WindowManagementSection from '@/components/user-settings/WindowManagementSection';
import { fetchWithAuth } from '@/utils/authUtils';
import { API_ENDPOINTS } from '@/config/api';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';
// Simple utility functions for logging
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * PropertySettingsTab component for the dashboard
 * This component reuses the existing property settings components
 * but integrates them directly into the dashboard.
 */
interface PropertySettingsTabProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

const PropertySettingsTab: React.FC<PropertySettingsTabProps> = ({
  isLoading = false,
  onRefresh,
}) => {
  // Create a request ID for logging correlation
  const [requestId] = useState(generateUUID());
  
  // Analytics tracking
  const trackComponentEvent = useComponentTracking('dashboard', 'PropertySettingsTab');
  
  // State for property settings
  const [propertyData, setPropertyData] = useState<any>(null);
  const [windowData, setWindowData] = useState<any>(null);
  const [weatherizationData, setWeatherizationData] = useState<any>(null);
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(isLoading);
  
  useEffect(() => {
    // Log component initialization
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "dashboard.PropertySettingsTab",
      operation: "initialize",
      correlation: {
        request_id: requestId
      },
      details: {
        tab_visible: true,
        initialized: true
      }
    }));
    
    fetchPropertyData();
  }, []);
  
  // Fetch all property-related data
  const fetchPropertyData = async () => {
    const startTime = performance.now();
    setLoading(true);
    setError('');
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "dashboard.PropertySettingsTab",
      operation: "fetchPropertyData.start",
      correlation: {
        request_id: requestId
      }
    }));
    
    try {
      // Track event
      trackComponentEvent('fetch_property_data');
      
      // Fetch property details
      const propertyResponse = await fetchWithAuth(API_ENDPOINTS.SETTINGS.PROPERTY);
      if (propertyResponse.ok) {
        const data = await propertyResponse.json();
        setPropertyData(data);
        
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          component: "dashboard.PropertySettingsTab",
          operation: "fetchPropertyDetails.success",
          correlation: {
            request_id: requestId
          },
          details: {
            property_type: data?.propertyType,
            has_property_data: !!data
          }
        }));
      } else {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          component: "dashboard.PropertySettingsTab",
          operation: "fetchPropertyDetails.error",
          correlation: {
            request_id: requestId
          },
          details: {
            status: propertyResponse.status,
            statusText: propertyResponse.statusText
          }
        }));
      }
      
      // Fetch window maintenance data
      const windowResponse = await fetchWithAuth(API_ENDPOINTS.SETTINGS.WINDOWS);
      if (windowResponse.ok) {
        const data = await windowResponse.json();
        setWindowData(data);
        
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          component: "dashboard.PropertySettingsTab",
          operation: "fetchWindowData.success",
          correlation: {
            request_id: requestId
          },
          details: {
            has_window_data: !!data
          }
        }));
      } else {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          component: "dashboard.PropertySettingsTab",
          operation: "fetchWindowData.error",
          correlation: {
            request_id: requestId
          },
          details: {
            status: windowResponse.status,
            statusText: windowResponse.statusText
          }
        }));
      }
      
      // Fetch weatherization data
      const weatherResponse = await fetchWithAuth(API_ENDPOINTS.SETTINGS.WEATHERIZATION);
      if (weatherResponse.ok) {
        const data = await weatherResponse.json();
        setWeatherizationData(data);
        
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "info",
          component: "dashboard.PropertySettingsTab",
          operation: "fetchWeatherizationData.success",
          correlation: {
            request_id: requestId
          },
          details: {
            has_weatherization_data: !!data
          }
        }));
      } else {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "warn",
          component: "dashboard.PropertySettingsTab",
          operation: "fetchWeatherizationData.error",
          correlation: {
            request_id: requestId
          },
          details: {
            status: weatherResponse.status,
            statusText: weatherResponse.statusText
          }
        }));
      }
      
      // Track success
      trackComponentEvent('fetch_property_data_success');
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        component: "dashboard.PropertySettingsTab",
        operation: "fetchPropertyData.complete",
        correlation: {
          request_id: requestId
        },
        details: {
          success: true,
          property_settings_available: !!(propertyData || windowData || weatherizationData),
          property_settings_source: propertyData?.autoPopulated ? "auto_populated" : "user_defined",
          property_type: propertyData?.propertyType
        },
        performance: {
          duration_ms: Math.round(performance.now() - startTime)
        }
      }));
    } catch (err) {
      console.error('Error fetching property data:', err);
      setError('Failed to load property settings. Please try again.');
      
      // Track error
      trackComponentEvent('fetch_property_data_error', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        component: "dashboard.PropertySettingsTab",
        operation: "fetchPropertyData",
        correlation: {
          request_id: requestId
        },
        details: {
          error: err instanceof Error ? err.message : "Unknown error",
          stack_trace: err instanceof Error ? err.stack : undefined,
          success: false
        },
        performance: {
          duration_ms: Math.round(performance.now() - startTime)
        }
      }));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle saving property details
  const handleSaveProperty = async (data: any): Promise<void> => {
    const startTime = performance.now();
    
    // Ensure data is a valid object and not false/null/undefined
    if (!data || typeof data !== 'object') {
      console.error('PROPERTY DETAILS SAVE ERROR: Invalid data type:', data);
      setError('Invalid property data format. Please try again.');
      
      // Additional logging for troubleshooting
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        component: "dashboard.PropertySettingsTab",
        operation: "validatePropertyData",
        correlation: {
          request_id: requestId
        },
        details: {
          error: "Invalid data type provided to handleSaveProperty",
          data_type: typeof data,
          data_value: String(data),
          stack_trace: new Error().stack
        }
      }));
      
      return;
    }
    
    // Log the full data payload for debugging
    console.log('PROPERTY DETAILS SAVE PAYLOAD:', data);
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "dashboard.PropertySettingsTab",
      operation: "savePropertyDetails.start",
      correlation: {
        request_id: requestId
      },
      details: {
        property_type: data?.propertyType,
        data_size: Object.keys(data).length,
        data_keys: Object.keys(data),
        data_structure: JSON.stringify(data)
        data_size: Object.keys(data).length,
        data_keys: Object.keys(data),
        data_structure: JSON.stringify(data)
      }
    }));
    
    try {
      // Track attempt
      trackComponentEvent('save_property_details', {
        dataSize: Object.keys(data).length
      });
      
      // Create a deep copy of data for logging purposes only
      const dataCopy = JSON.parse(JSON.stringify(data));
      
      console.log('PROPERTY SETTINGS - Request payload:', JSON.stringify(dataCopy, null, 2));
      
      const response = await fetchWithAuth(API_ENDPOINTS.SETTINGS.PROPERTY, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      // Log the full response
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawText: responseText };
      }
      
      console.log('PROPERTY SETTINGS - Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        body: responseData
      });

      if (!response.ok) {
        console.error('PROPERTY SETTINGS - Error details:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(`Failed to save property details: ${response.status} ${response.statusText}`);
      }
      
      setSuccess('Property details saved successfully');
      setPropertyData(data);
      
      // Track success
      trackComponentEvent('save_property_details_success');
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        component: "dashboard.PropertySettingsTab",
        operation: "savePropertyDetails.complete",
        correlation: {
          request_id: requestId
        },
        details: {
          success: true,
          updated_fields: Object.keys(data),
          property_type: data?.propertyType
        },
        performance: {
          duration_ms: Math.round(performance.now() - startTime)
        }
      }));
      
      // Success, void return
    } catch (err) {
      console.error('PROPERTY SETTINGS - Save error:', err);
      setError(`Failed to save property details: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Track error
      trackComponentEvent('save_property_details_error', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        component: "dashboard.PropertySettingsTab",
        operation: "savePropertyDetails",
        correlation: {
          request_id: requestId
        },
        details: {
          error: err instanceof Error ? err.message : "Unknown error",
          stack_trace: err instanceof Error ? err.stack : undefined,
          success: false
        },
        performance: {
          duration_ms: Math.round(performance.now() - startTime)
        }
      }));
      
      // Error, void return
    }
  };
  
  // Handle saving window maintenance data
  const handleSaveWindowData = async (data: any): Promise<void> => {
    const startTime = performance.now();
    
    // Log the full data payload for debugging
    console.log('WINDOW DATA SAVE PAYLOAD:', JSON.stringify(data, null, 2));
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "dashboard.PropertySettingsTab",
      operation: "saveWindowData.start",
      correlation: {
        request_id: requestId
      },
      details: {
        window_count: data?.windowCount,
        window_type: data?.windowType,
        data_size: Object.keys(data).length,
        data_keys: Object.keys(data),
        data_structure: JSON.stringify(data)
      }
    }));
    
    try {
      // Track attempt
      trackComponentEvent('save_window_data', {
        dataSize: Object.keys(data).length
      });
      
      // Create a deep copy of data for logging purposes only
      const dataCopy = JSON.parse(JSON.stringify(data));
      
      console.log('WINDOW SETTINGS - Request payload:', JSON.stringify(dataCopy, null, 2));
      
      const response = await fetchWithAuth(API_ENDPOINTS.SETTINGS.WINDOWS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      // Log the full response
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawText: responseText };
      }
      
      console.log('WINDOW SETTINGS - Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        body: responseData
      });

      if (!response.ok) {
        console.error('WINDOW SETTINGS - Error details:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        throw new Error(`Failed to save window data: ${response.status} ${response.statusText}`);
      }

      setWindowData(responseData);
      setSuccess('Window maintenance data saved successfully');
      
      // Track success
      trackComponentEvent('save_window_data_success');
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        component: "dashboard.PropertySettingsTab",
        operation: "saveWindowData.complete",
        correlation: {
          request_id: requestId
        },
        details: {
          success: true,
          updated_fields: Object.keys(data),
          window_count: data?.windowCount,
          window_type: data?.windowType
        },
        performance: {
          duration_ms: Math.round(performance.now() - startTime)
        }
      }));
      
      // Success, void return
    } catch (err) {
      console.error('WINDOW SETTINGS - Save error:', err);
      setError(`Failed to save window data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // Track error
      trackComponentEvent('save_window_data_error', {
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        component: "dashboard.PropertySettingsTab",
        operation: "saveWindowData",
        correlation: {
          request_id: requestId
        },
        details: {
          error: err instanceof Error ? err.message : "Unknown error",
          stack_trace: err instanceof Error ? err.stack : undefined,
          success: false
        },
        performance: {
          duration_ms: Math.round(performance.now() - startTime)
        }
      }));
      
      // Error, void return
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "dashboard.PropertySettingsTab",
      operation: "refresh",
      correlation: {
        request_id: requestId
      }
    }));
    
    fetchPropertyData();
    if (onRefresh) onRefresh();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Cog className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-xl font-semibold">Property Settings</h3>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h4 className="text-lg font-medium mb-4">Property Details</h4>
        <PropertyDetailsForm 
          initialData={{ propertyDetails: propertyData, windowMaintenance: windowData }}
          onSave={(success) => {
            if (success) {
              // We need to create/extract a formatted property details object
              // based on the form values rather than passing a boolean to the API
              // Extract values from the form and create a proper property details object
              const formElement = document.querySelector('form');
              if (formElement) {
                const formData = new FormData(formElement);
                const propertyDetails = {
                  propertyType: formData.get('propertyType') || propertyData?.propertyType || 'single-family',
                  ownershipStatus: formData.get('ownershipStatus') || propertyData?.ownershipStatus || 'owned',
                  squareFootage: Number(formData.get('squareFootage')) || propertyData?.squareFootage || 1800,
                  yearBuilt: Number(formData.get('yearBuilt')) || propertyData?.yearBuilt || 1990,
                  stories: propertyData?.stories || 1,
                  insulation: propertyData?.insulation || {
                    attic: 'not-sure',
                    walls: 'not-sure',
                    basement: 'not-sure',
                    floor: 'not-sure'
                  },
                  // Include nested structure to match expected format
                  windows: {
                    type: formData.get('windowType') || windowData?.windowType || 'double',
                    count: Number(formData.get('windowCount')) || windowData?.windowCount || 8,
                    condition: 'good'
                  },
                  weatherization: {
                    drafts: false,
                    visibleGaps: false,
                    condensation: false,
                    weatherStripping: 'not-sure'
                  }
                };
                
                console.log('Submitting property details:', propertyDetails);
                handleSaveProperty(propertyDetails);
              } else {
                // Fallback to using the existing data if we can't get form values
                console.log('Using existing property data:', propertyData);
                if (propertyData) {
                  handleSaveProperty(propertyData);
                } else {
                  setError('Could not find property form data');
                }
              }
            } else {
              setError('Failed to save property details');
            }
          }}
        />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <HomeConditionsSection onSave={handleSaveProperty} />
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <WindowManagementSection
          data={windowData}
          weatherizationData={weatherizationData}
          onSave={handleSaveWindowData}
          onWeatherizationSave={async (data) => {
            // Update weatherization data
            console.log('📊 SAVING WEATHERIZATION DATA:', data);
            const weatherizationDetail = {
              ...weatherizationData,
              ...data,
            };

            if (propertyData) {
              // Merge with property data to save together
              return handleSaveProperty({
                ...propertyData,
                weatherization: weatherizationDetail
              });
            } else {
              console.log('⚠️ No property data available to save weatherization data with');
              return Promise.resolve(); // Return resolved promise if no data to save
            }
          }}
        />
      </div>
    </div>
  );
};

export default PropertySettingsTab;
