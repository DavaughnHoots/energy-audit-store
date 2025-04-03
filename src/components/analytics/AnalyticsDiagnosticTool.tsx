import React, { useState } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AnalyticsEventType } from '../../types/analytics';

/**
 * A diagnostic tool to test analytics tracking functionality
 * This component is used for troubleshooting analytics issues
 */
const AnalyticsDiagnosticTool: React.FC = () => {
  const { trackEvent, isTrackingEnabled, sessionId, consentStatus } = useAnalytics();
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Function to add logs to the display
  const addLog = (message: string) => {
    setLogMessages(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  // Test tracking a page view event
  const testPageViewEvent = () => {
    try {
      trackEvent(AnalyticsEventType.PAGE_VIEW, 'diagnostic-page', {
        path: '/admin/diagnostic',
        title: 'Analytics Diagnostic Tool'
      });
      
      addLog('✅ PAGE_VIEW event dispatched to AnalyticsContext');
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Test tracking a feature usage event
  const testFeatureEvent = () => {
    try {
      trackEvent(AnalyticsEventType.FEATURE_USAGE, 'diagnostic-tool', {
        featureId: 'analytics-test-button',
        action: 'click'
      });
      
      addLog('✅ FEATURE_USAGE event dispatched to AnalyticsContext');
    } catch (error) {
      addLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Test clearing all logs
  const clearLogs = () => {
    setLogMessages([]);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Analytics Diagnostic Tool</h2>
      
      {/* Status information */}
      <div className="mb-4 p-4 bg-gray-100 rounded-md">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-medium text-gray-500">Tracking Enabled:</div>
          <div className={`text-sm font-medium ${isTrackingEnabled ? 'text-green-600' : 'text-red-600'}`}>
            {isTrackingEnabled ? 'YES' : 'NO'}
          </div>
          
          <div className="text-sm font-medium text-gray-500">Consent Status:</div>
          <div className="text-sm font-medium text-blue-600">{consentStatus}</div>
          
          <div className="text-sm font-medium text-gray-500">Session ID:</div>
          <div className="text-sm font-mono text-gray-800 truncate">{sessionId || 'None'}</div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={testPageViewEvent}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Test Page View Event
        </button>
        
        <button
          onClick={testFeatureEvent}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Test Feature Usage Event
        </button>
        
        <button
          onClick={clearLogs}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Clear Logs
        </button>
      </div>
      
      {/* Log display */}
      <div className="border border-gray-300 rounded-md p-2 h-48 overflow-y-auto font-mono text-sm bg-gray-50">
        {logMessages.length === 0 ? (
          <div className="text-gray-500 italic p-2">No log messages yet. Click a test button to start.</div>
        ) : (
          logMessages.map((msg, index) => (
            <div key={index} className="border-b border-gray-200 pb-1 mb-1 whitespace-pre-wrap">
              {msg}
            </div>
          ))
        )}
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Note: Events are added to a queue and may not be sent immediately. Check console logs for network requests.
      </div>
    </div>
  );
};

export default AnalyticsDiagnosticTool;
