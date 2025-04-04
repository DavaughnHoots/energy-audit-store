import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AnalyticsEventType } from '../../types/analytics';

/**
 * A diagnostic tool for analytics monitoring integrated with the admin dashboard
 */
const AnalyticsDiagnosticTool: React.FC = () => {
  const { trackEvent, consentStatus, updateConsent, isTrackingEnabled, sessionId } = useAnalytics();
  const [events, setEvents] = useState<any[]>([]);
  const [localStorageEvents, setLocalStorageEvents] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    // Check localStorage for events
    const storedEvents = localStorage.getItem('energy_audit_event_queue');
    if (storedEvents) {
      setLocalStorageEvents(storedEvents);
    }
  }, []);

  // Refresh the localStorage events display
  const refreshLocalStorageEvents = () => {
    const storedEvents = localStorage.getItem('energy_audit_event_queue');
    if (storedEvents) {
      setLocalStorageEvents(storedEvents);
    } else {
      setLocalStorageEvents('');
    }
  };

  const generateTestEvent = () => {
    const eventType = AnalyticsEventType.FEATURE_USAGE;
    const area = 'admin_dashboard';
    const data = {
      featureId: 'analytics_test',
      testTime: new Date().toISOString(),
      testId: Math.floor(Math.random() * 1000)
    };

    // Clear previous test result
    setTestResult(null);

    // Track the event
    trackEvent(eventType, area, data);

    // Add to local list for display
    const newEvent = {
      eventType,
      area,
      timestamp: new Date().toISOString(),
      data
    };
    
    setEvents(prev => [...prev, newEvent]);
    
    // Refresh localStorage display
    setTimeout(refreshLocalStorageEvents, 100);
    
    setTestResult({
      success: true,
      message: 'Test event generated and queued'
    });
  };

  const clearLocalStorageQueue = () => {
    localStorage.removeItem('energy_audit_event_queue');
    setLocalStorageEvents('');
    setTestResult({
      success: true,
      message: 'LocalStorage event queue cleared'
    });
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const toggleConsent = async () => {
    await updateConsent(!isTrackingEnabled);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Analytics Diagnostics</h3>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Analytics Status</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Session ID:</strong></div>
            <div className="overflow-hidden text-ellipsis">{sessionId || 'No session ID'}</div>
            <div><strong>Consent Status:</strong></div>
            <div>{consentStatus}</div>
            <div><strong>Tracking Enabled:</strong></div>
            <div>{isTrackingEnabled ? 'Yes' : 'No'}</div>
          </div>
          <button 
            onClick={toggleConsent} 
            className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            {isTrackingEnabled ? 'Disable Tracking' : 'Enable Tracking'}
          </button>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <button 
            onClick={generateTestEvent} 
            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
          >
            Generate Test Event
          </button>
          <button 
            onClick={clearLocalStorageQueue} 
            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700"
          >
            Clear Event Queue
          </button>
          <button 
            onClick={clearEvents} 
            className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Clear Display
          </button>
          <button 
            onClick={refreshLocalStorageEvents} 
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        
        {testResult && (
          <div className={`mb-4 p-3 rounded-md text-sm ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <strong>{testResult.success ? 'Success' : 'Error'}:</strong> {testResult.message}
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Generated Events ({events.length})</h4>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
          {events.length === 0 ? (
            <div className="italic text-gray-500 text-sm">No events generated</div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="mb-2 text-xs border-b border-gray-100 pb-2 break-all">
                <strong>{event.timestamp}:</strong> {event.eventType} in {event.area}
                <pre className="mt-1 bg-gray-100 p-1 rounded-sm overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">LocalStorage Queue</h4>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50 text-xs">
          {!localStorageEvents ? (
            <div className="italic text-gray-500">Queue is empty</div>
          ) : (
            <pre className="break-all whitespace-pre-wrap overflow-x-auto">{localStorageEvents}</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDiagnosticTool;
