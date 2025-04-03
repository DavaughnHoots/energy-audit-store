import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AnalyticsEventType } from '../../types/analytics';
import * as axiosModule from 'axios';
const axios = axiosModule.default || axiosModule;
import { API_BASE_URL } from '../../config/api';

/**
 * A diagnostic tool to help troubleshoot analytics issues
 */
const AnalyticsDiagnosticTool: React.FC = () => {
  const { trackEvent, consentStatus, updateConsent, isTrackingEnabled, sessionId } = useAnalytics();
  const [events, setEvents] = useState<any[]>([]);
  const [localStorageEvents, setLocalStorageEvents] = useState<string>('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check localStorage for events
    const storedEvents = localStorage.getItem('energy_audit_event_queue');
    if (storedEvents) {
      setLocalStorageEvents(storedEvents);
    }
  }, [isOpen]);

  const generateTestEvent = () => {
    const eventType = AnalyticsEventType.FEATURE_USAGE;
    const area = 'diagnostics';
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
  };

  const forceFlushEvents = async () => {
    setTestResult(null);
    
    try {
      // Force flush by calling the API directly
      const storedEvents = localStorage.getItem('energy_audit_event_queue');
      const storedSessionId = localStorage.getItem('energy_audit_session_id');
      
      if (!storedEvents || !storedSessionId) {
        setTestResult({
          success: false,
          message: `No events to flush. Events: ${!!storedEvents}, SessionId: ${!!storedSessionId}`
        });
        return;
      }
      
      const events = JSON.parse(storedEvents);
      
      const response = await axios.post(`${API_BASE_URL}/api/analytics/events`, {
        events,
        sessionId: storedSessionId
      });
      
      setTestResult({
        success: true,
        message: `Successfully flushed ${events.length} events. Response: ${response.status} ${response.statusText}`
      });
      
      // Clear localStorage
      localStorage.removeItem('energy_audit_event_queue');
      setLocalStorageEvents('');
      
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(error)) {
        errorMessage = `${error.message} - Status: ${error.response?.status} ${error.response?.statusText}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setTestResult({
        success: false,
        message: `Error flushing events: ${errorMessage}`
      });
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const toggleConsent = async () => {
    await updateConsent(!isTrackingEnabled);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '5px 10px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ccc',
          borderRadius: '4px',
          opacity: 0.7
        }}
      >
        Analytics Debug
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      overflowY: 'auto',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      padding: '10px',
      zIndex: 9999,
      boxShadow: '0 0 10px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Analytics Diagnostic Tool</h3>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </div>
      
      <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>Status</h4>
        <div><strong>Session ID:</strong> {sessionId || 'No session ID'}</div>
        <div><strong>Consent Status:</strong> {consentStatus}</div>
        <div><strong>Tracking Enabled:</strong> {isTrackingEnabled ? 'Yes' : 'No'}</div>
        <button onClick={toggleConsent} style={{ marginTop: '5px' }}>
          {isTrackingEnabled ? 'Disable Tracking' : 'Enable Tracking'}
        </button>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <button onClick={generateTestEvent}>Generate Test Event</button>
        <button onClick={forceFlushEvents} style={{ marginLeft: '5px' }}>Force Flush Events</button>
        <button onClick={clearEvents} style={{ marginLeft: '5px' }}>Clear List</button>
      </div>
      
      {testResult && (
        <div style={{ 
          marginBottom: '10px', 
          padding: '10px', 
          backgroundColor: testResult.success ? '#e6ffe6' : '#ffe6e6', 
          borderRadius: '4px' 
        }}>
          <strong>{testResult.success ? 'Success' : 'Error'}:</strong> {testResult.message}
        </div>
      )}
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>Generated Events ({events.length})</h4>
        <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '5px' }}>
          {events.length === 0 ? (
            <div style={{ fontStyle: 'italic', color: '#999' }}>No events generated</div>
          ) : (
            events.map((event, index) => (
              <div key={index} style={{ marginBottom: '5px', fontSize: '12px', wordBreak: 'break-all' }}>
                <strong>{event.timestamp}:</strong> {event.eventType} in {event.area}
                <pre style={{ margin: '2px 0', backgroundColor: '#f9f9f9', padding: '2px' }}>
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 5px 0' }}>LocalStorage Queue</h4>
        <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #eee', padding: '5px', fontSize: '12px' }}>
          {!localStorageEvents ? (
            <div style={{ fontStyle: 'italic', color: '#999' }}>Queue is empty</div>
          ) : (
            <pre style={{ margin: 0, wordBreak: 'break-all' }}>{localStorageEvents}</pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDiagnosticTool;
