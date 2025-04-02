import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AnalyticsEventType } from '../types/analytics';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create API instance with axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

interface AnalyticsContextType {
  trackEvent: (eventType: AnalyticsEventType, area: string, data?: Record<string, any>) => void;
  consentStatus: 'not_asked' | 'granted' | 'denied' | 'withdrawn';
  updateConsent: (consent: boolean) => Promise<void>;
  isTrackingEnabled: boolean;
  sessionId: string | null;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent: () => {},
  consentStatus: 'not_asked',
  updateConsent: async () => {},
  isTrackingEnabled: false,
  sessionId: null
});

const LOCAL_STORAGE_KEYS = {
  SESSION_ID: 'energy_audit_session_id',
  CONSENT_STATUS: 'energy_audit_analytics_consent',
  EVENT_QUEUE: 'energy_audit_event_queue'
};

/**
 * Maximum events to batch together before sending
 */
const MAX_BATCH_SIZE = 20;

/**
 * Auto-flush timer in milliseconds (5 seconds)
 */
const FLUSH_INTERVAL = 5000;

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [consentStatus, setConsentStatus] = useState<'not_asked' | 'granted' | 'denied' | 'withdrawn'>('not_asked');
  const [eventQueue, setEventQueue] = useState<any[]>([]);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [flushTimer, setFlushTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * Initialize the analytics context
   */
  useEffect(() => {
    // Load or create session ID
    const storedSessionId = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ID);
    const newSessionId = storedSessionId || uuidv4();
    
    if (!storedSessionId) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION_ID, newSessionId);
    }
    
    setSessionId(newSessionId);
    
    // Load consent status
    const storedConsent = localStorage.getItem(LOCAL_STORAGE_KEYS.CONSENT_STATUS);
    if (storedConsent) {
      setConsentStatus(storedConsent as any);
      setIsTrackingEnabled(storedConsent === 'granted');
    } else {
      // If user is authenticated, fetch consent status from server
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        apiClient.get('/api/analytics/consent')
          .then((response: any) => {
            const status = response.data.status || 'not_asked';
            setConsentStatus(status);
            setIsTrackingEnabled(status === 'granted');
            localStorage.setItem(LOCAL_STORAGE_KEYS.CONSENT_STATUS, status);
          })
          .catch(() => {
            // If error, default to not asked
            setConsentStatus('not_asked');
            setIsTrackingEnabled(false);
          });
      }
    }
    
    // Load any queued events from localStorage
    try {
      const storedQueue = localStorage.getItem(LOCAL_STORAGE_KEYS.EVENT_QUEUE);
      if (storedQueue) {
        const parsedQueue = JSON.parse(storedQueue);
        if (Array.isArray(parsedQueue) && parsedQueue.length > 0) {
          setEventQueue(parsedQueue);
        }
      }
    } catch (e) {
      // If error parsing, clear the queue
      localStorage.removeItem(LOCAL_STORAGE_KEYS.EVENT_QUEUE);
    }
    
    // Set up session end handler
    const handleBeforeUnload = () => {
      if (isTrackingEnabled && sessionId) {
        trackSessionEnd();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // If tracking is enabled, track session start
    if (isTrackingEnabled && sessionId) {
      trackSessionStart();
    }
    
    // Set up auto-flush timer
    const timer = setInterval(() => {
      if (isTrackingEnabled && eventQueue.length > 0) {
        flushEvents();
      }
    }, FLUSH_INTERVAL);
    
    setFlushTimer(timer);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (flushTimer) {
        clearInterval(flushTimer);
      }
      
      // Save queue to localStorage
      if (eventQueue.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.EVENT_QUEUE, JSON.stringify(eventQueue));
      }
    };
  }, []);
  
  /**
   * Track session start event
   */
  const trackSessionStart = useCallback(() => {
    if (!sessionId) return;
    
    const event = {
      eventType: AnalyticsEventType.SESSION_START,
      area: 'session',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      referrer: document.referrer
    };
    
    addToQueue(event);
  }, [sessionId]);
  
  /**
   * Track session end event
   */
  const trackSessionEnd = useCallback(() => {
    if (!sessionId) return;
    
    // Calculate session duration
    const startEvent = eventQueue.find(e => e.eventType === AnalyticsEventType.SESSION_START);
    let duration = 0;
    
    if (startEvent) {
      const startTime = new Date(startEvent.timestamp).getTime();
      const endTime = Date.now();
      duration = Math.floor((endTime - startTime) / 1000); // Duration in seconds
    }
    
    const event = {
      eventType: AnalyticsEventType.SESSION_END,
      area: 'session',
      timestamp: new Date().toISOString(),
      duration
    };
    
    addToQueue(event);
    
    // Immediate flush since the page is unloading
    navigator.sendBeacon(
      `${API_BASE_URL}/api/analytics/events`,
      JSON.stringify({
        events: [...eventQueue, event],
        sessionId
      })
    );
  }, [sessionId, eventQueue]);
  
  /**
   * Add an event to the queue
   */
  const addToQueue = useCallback((event: any) => {
    setEventQueue(prevQueue => {
      const newQueue = [...prevQueue, event];
      
      // If queue is too large, flush it
      if (newQueue.length >= MAX_BATCH_SIZE) {
        flushEvents();
        return [];
      }
      
      return newQueue;
    });
  }, []);
  
  /**
   * Flush events to the server
   */
  const flushEvents = useCallback(async () => {
    if (!sessionId || eventQueue.length === 0) return;
    
    try {
      await apiClient.post('/api/analytics/events', {
        events: eventQueue,
        sessionId
      });
      
      // Clear the queue after successful send
      setEventQueue([]);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.EVENT_QUEUE);
    } catch (error) {
      // Keep events in queue if send fails
      console.error('Failed to send analytics events:', error);
    }
  }, [sessionId, eventQueue]);
  
  /**
   * Track an event
   */
  const trackEvent = useCallback((
    eventType: AnalyticsEventType,
    area: string,
    data: Record<string, any> = {}
  ) => {
    if (!isTrackingEnabled || !sessionId) return;
    
    const event = {
      eventType,
      area,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    addToQueue(event);
  }, [isTrackingEnabled, sessionId, addToQueue]);
  
  /**
   * Update user consent status
   */
  const updateConsent = useCallback(async (consent: boolean) => {
    const newStatus = consent ? 'granted' : 'denied';
    
    // Save locally
    setConsentStatus(newStatus);
    setIsTrackingEnabled(consent);
    localStorage.setItem(LOCAL_STORAGE_KEYS.CONSENT_STATUS, newStatus);
    
    try {
      // Send to server if user is authenticated
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        await apiClient.post('/api/analytics/consent', { consent });
      }
      
      // If consent granted, start tracking session
      if (consent && sessionId) {
        trackSessionStart();
      }
    } catch (error) {
      console.error('Failed to update consent status:', error);
    }
  }, [sessionId, trackSessionStart]);
  
  /**
   * Get device type based on user agent
   */
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };
  
  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        consentStatus,
        updateConsent,
        isTrackingEnabled,
        sessionId
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => useContext(AnalyticsContext);
