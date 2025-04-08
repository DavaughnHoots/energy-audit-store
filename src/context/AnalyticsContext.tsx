import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useAuth from './AuthContext';
import { getApiUrl } from '../config/api';

// Define types for analytics events and context
export type AnalyticsEventType = 
  | 'page_view' 
  | 'component_interaction' 
  | 'form_interaction'
  | 'form_start'
  | 'form_step'
  | 'form_complete'
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
  | 'auth'
  | 'admin'     // Add support for admin dashboard area
  | 'debug'     // Add support for debug/diagnostics area
  | 'home';     // Add support for home page area

interface AnalyticsEvent {
  sessionId: string;
  eventType: AnalyticsEventType;
  area: AnalyticsArea;
  data: Record<string, any>;
  timestamp: string; // ISO string timestamp for when the event was created
  eventId?: string;  // Optional unique ID for the event (for deduplication)
}

// Interface for the deduplication cache entry
interface DeduplicationCacheEntry {
  timestamp: number;
  eventType: AnalyticsEventType;
  area: AnalyticsArea;
  path?: string;
  eventId?: string;
}

// Debug mode flag to control verbose logging
const ANALYTICS_DEBUG_MODE = true;

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

// Configuration constants
const EVENT_BUFFER_SIZE = 10;         // Number of events to buffer before sending
const EVENT_BUFFER_TIMEOUT = 5000;    // ms before flushing buffer
const DEDUPLICATION_WINDOW = 2000;    // ms to ignore duplicate events
const DEDUPLICATION_CACHE_SIZE = 50;  // Number of recent events to keep in deduplication cache

// Areas that should not be tracked
const BLOCKED_ANALYTICS_AREAS: AnalyticsArea[] = ['admin'];

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [eventBuffer, setEventBuffer] = useState<AnalyticsEvent[]>([]);
  const [bufferTimeout, setBufferTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();
  
  // Use a ref for the deduplication cache to avoid re-renders when it changes
  const deduplicationCacheRef = useRef<DeduplicationCacheEntry[]>([]);

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
        console.log('%c [ANALYTICS DEBUG] Sending event to server:', 'background: #333; color: #1e90ff', {
          eventId: event.eventId,
          eventType: event.eventType,
          area: event.area,
          timestamp: event.timestamp
        });
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

  /**
   * Check if an event is a duplicate of a recently tracked event
   * Uses multiple criteria for deduplication including time window, event type, area, and path
   */
  const isDuplicateEvent = (
    eventType: AnalyticsEventType, 
    area: AnalyticsArea, 
    data: Record<string, any>
  ): boolean => {
    const now = Date.now();
    const cache = deduplicationCacheRef.current;
    
    // Special handling for page_view events which are more prone to duplication
    if (eventType === 'page_view') {
      // Look for events of the same type, area, and path within the deduplication window
      const similarEvent = cache.find(entry => 
        entry.eventType === eventType &&
        entry.area === area &&
        entry.path === data.path &&
        now - entry.timestamp < DEDUPLICATION_WINDOW
      );
      
      return !!similarEvent;
    }
    
    // For events with an eventId, use that for deduplication
    if (data.eventId) {
      const duplicateById = cache.find(entry => 
        entry.eventId === data.eventId &&
        now - entry.timestamp < DEDUPLICATION_WINDOW
      );
      
      return !!duplicateById;
    }
    
    // For other events, just use type and area with a shorter window
    const similarEvent = cache.find(entry => 
      entry.eventType === eventType &&
      entry.area === area &&
      now - entry.timestamp < (DEDUPLICATION_WINDOW / 2)
    );
    
    return !!similarEvent;
  };
  
  /**
   * Add an event to the deduplication cache
   */
  const addToDeduplicationCache = (
    eventType: AnalyticsEventType, 
    area: AnalyticsArea, 
    data: Record<string, any>
  ) => {
    const cache = deduplicationCacheRef.current;
    
    // Add the new event to the cache
    cache.push({
      timestamp: Date.now(),
      eventType,
      area,
      path: data.path,
      eventId: data.eventId
    });
    
    // Limit cache size by removing oldest entries
    if (cache.length > DEDUPLICATION_CACHE_SIZE) {
      deduplicationCacheRef.current = cache.slice(-DEDUPLICATION_CACHE_SIZE);
    }
  };

  /**
   * Track an analytics event with deduplication
   */
  const trackEvent = (eventType: AnalyticsEventType, area: AnalyticsArea, data: Record<string, any>) => {
    // DEBUG: Always log tracking events in detail
    console.log('%c [ANALYTICS DEBUG] Track Event:', 'background: #333; color: #32cd32', {
      eventType,
      area,
      data,
      timestamp: new Date().toISOString(),
      sessionId,
      deduplicateCache: deduplicationCacheRef.current.length
    });
    if (!sessionId) return;
    
    // Skip tracking for blocked areas
    // DEBUG: Mark when an event is being blocked
    if (ANALYTICS_DEBUG_MODE && BLOCKED_ANALYTICS_AREAS.includes(area)) {
      console.log(`[DEBUG] Skipping analytics tracking for blocked area: ${area}`);
    }
    
    if (BLOCKED_ANALYTICS_AREAS.includes(area)) {
      console.log(`Skipping analytics tracking for blocked area: ${area}`);
      return;
    }
    
    // Check for duplicate events (prevent tracking the same event multiple times)
    if (isDuplicateEvent(eventType, area, data)) {
      console.log('%c [ANALYTICS DEBUG] Duplicate event detected:', 'background: #333; color: #ff6347', {
        eventType,
        area,
        data: data.path || data.eventId || 'No key data'
      });
      console.log(`Duplicate event detected and skipped: ${eventType} in ${area}`);
      return;
    }
    
    // Add to deduplication cache for future checks
    addToDeduplicationCache(eventType, area, data);
    
    // Create the event object
    const newEvent: AnalyticsEvent = {
      sessionId,
      eventType,
      area,
      data,
      timestamp: new Date().toISOString(),
      eventId: data.eventId || `${eventType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    // Add event to buffer
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
