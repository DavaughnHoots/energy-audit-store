import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useAuth from './AuthContext';
import { getApiUrl } from '../config/api';

// Define types for analytics events and context
export type AnalyticsEventType = 
  | 'page_view' 
  | 'component_interaction' 
  | 'form_interaction'
  | 'product_view'
  | 'recommendation_view'
  | 'recommendation_action';

export type AnalyticsArea =
  | 'products'
  | 'energy_audit'
  | 'dashboard'
  | 'reports'
  | 'settings'
  | 'education'
  | 'community'
  | 'auth';

interface AnalyticsEvent {
  sessionId: string;
  eventType: AnalyticsEventType;
  area: AnalyticsArea;
  data: Record<string, any>;
}

interface AnalyticsContextType {
  trackEvent: (eventType: AnalyticsEventType, area: AnalyticsArea, data: Record<string, any>) => void;
  sessionId: string;
}

// Create context with default values
const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  sessionId: '',
});

export const useAnalytics = () => useContext(AnalyticsContext);

// Buffer to store events before sending to reduce network requests
const EVENT_BUFFER_SIZE = 10;
const EVENT_BUFFER_TIMEOUT = 5000; // ms

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [eventBuffer, setEventBuffer] = useState<AnalyticsEvent[]>([]);
  const [bufferTimeout, setBufferTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  // Initialize session ID
  useEffect(() => {
    // Try to get existing session ID from localStorage
    let storedSessionId = localStorage.getItem('analytics_session_id');
    
    if (!storedSessionId) {
      // Create a new session ID if none exists
      storedSessionId = uuidv4();
      localStorage.setItem('analytics_session_id', storedSessionId);
    }
    
    setSessionId(storedSessionId);
    
    // Create or update session when component mounts
    const createOrUpdateSession = async () => {
      try {
        await fetch(getApiUrl('/api/analytics/session'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            sessionId: storedSessionId,
            userId: user?.id 
          })
        });
      } catch (error) {
        console.error('Failed to create/update analytics session:', error);
      }
    };
    
    createOrUpdateSession();
    
    // Cleanup function
    return () => {
      if (bufferTimeout) {
        clearTimeout(bufferTimeout);
      }
    };
  }, [user?.id]);

  // Send events in buffer to server
  const sendEvents = async () => {
    if (eventBuffer.length === 0) return;
    
    try {
      // Clone the current buffer for sending
      const eventsToSend = [...eventBuffer];
      
      // Clear the buffer immediately to avoid duplicate sends
      setEventBuffer([]);
      
      // Reset timeout
      if (bufferTimeout) {
        clearTimeout(bufferTimeout);
        setBufferTimeout(null);
      }
      
      // Send each event individually to match backend API
      for (const event of eventsToSend) {
        await fetch(getApiUrl('/api/analytics/event'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            sessionId: event.sessionId,
            eventType: event.eventType,
            area: event.area,
            data: event.data
          })
        });
      }
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      
      // On failure, add events back to buffer
      setEventBuffer((prev: AnalyticsEvent[]) => [...prev, ...eventBuffer]);
    }
  };

  // Set up automatic sending of events after timeout
  useEffect(() => {
    if (eventBuffer.length > 0 && !bufferTimeout) {
      const timeout = setTimeout(sendEvents, EVENT_BUFFER_TIMEOUT);
      setBufferTimeout(timeout);
    }
  }, [eventBuffer]);

  // Track an event
  const trackEvent = (eventType: AnalyticsEventType, area: AnalyticsArea, data: Record<string, any>) => {
    if (!sessionId) return;
    
    // Add event to buffer
    const newEvent: AnalyticsEvent = {
      sessionId,
      eventType,
      area,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      }
    };
    
    const newBuffer = [...eventBuffer, newEvent];
    setEventBuffer(newBuffer);
    
    // Send immediately if buffer size threshold is reached
    if (newBuffer.length >= EVENT_BUFFER_SIZE) {
      sendEvents();
    }
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, sessionId }}>
      {children}
    </AnalyticsContext.Provider>
  );
};
