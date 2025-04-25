import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import useAuth from '../../context/AuthContext';
import apiClient from '../../services/apiClient';

// Initialize or get session ID
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// How long to wait before considering a page view complete (for time tracking)
const PAGE_VIEW_TIMEOUT = 30000; // 30 seconds

interface FeatureUsageEvent {
  featureId: string;
  featureName: string;
  featureCategory: string;
  pageContext: string;
  interactionType: 'click' | 'view' | 'submit';
  interactionData?: Record<string, any>;
}

/**
 * Component that tracks user navigation and feature usage
 * This is invisible and just handles the analytics tracking
 */
const AnalyticsTracker: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sessionId = getOrCreateSessionId();

  // Track page visits
  useEffect(() => {
    const currentPath = location.pathname;
    const referrer = document.referrer;
    const startTime = Date.now();
    let exitTracked = false;

    // Record the page visit
    const trackPageVisit = async (isExit = false, timeSpent = 0) => {
      try {
        if (exitTracked) return; // Prevent duplicate tracking
        if (isExit) exitTracked = true;

        await apiClient.post('/api/analytics/page-visit', {
          sessionId,
          userId: user?.id,
          pagePath: currentPath,
          pageTitle: document.title,
          referrerPage: referrer,
          exitPage: isExit,
          timeSpentSeconds: Math.floor(timeSpent / 1000),
          deviceType: window.innerWidth <= 768 ? 'mobile' : 'desktop',
          isMobile: window.innerWidth <= 768
        });
      } catch (error) {
        console.error('Error tracking page visit:', error);
      }
    };

    // Track initial page visit
    trackPageVisit(false, 0);

    // Track exit or time spent when navigating away
    const handleBeforeUnload = () => {
      const timeSpent = Date.now() - startTime;
      trackPageVisit(true, timeSpent);
    };

    // Track time spent when component unmounts
    const cleanup = () => {
      const timeSpent = Date.now() - startTime;
      trackPageVisit(false, timeSpent);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, [location, sessionId, user]);

  // Function to track feature usage (to be called from other components)
  const trackFeatureUsage = async (event: FeatureUsageEvent) => {
    try {
      await apiClient.post('/api/analytics/feature-usage', {
        sessionId,
        userId: user?.id,
        ...event,
        pageContext: event.pageContext || location.pathname
      });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  };

  // Expose tracking function globally
  useEffect(() => {
    (window as any).trackFeatureUsage = trackFeatureUsage;
    return () => {
      delete (window as any).trackFeatureUsage;
    };
  }, [user, sessionId, location]);

  // This component doesn't render anything
  return null;
};

export default AnalyticsTracker;
