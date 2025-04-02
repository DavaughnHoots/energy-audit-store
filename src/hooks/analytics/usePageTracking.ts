import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AnalyticsEventType, AnalyticsArea } from '../../types/analytics';

/**
 * Hook to automatically track page views and time spent on pages
 * @param options Configuration options for page tracking
 * @returns void
 */
export default function usePageTracking(options: {
  area?: AnalyticsArea;
  pageTitle?: string;
  excludePaths?: string[];
} = {}) {
  const location = useLocation();
  const { trackEvent, isTrackingEnabled } = useAnalytics();
  const pageEnterTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>(location.pathname);
  
  const {
    area = AnalyticsArea.GENERAL,
    pageTitle,
    excludePaths = []
  } = options;

  useEffect(() => {
    // Skip tracking for excluded paths
    if (
      !isTrackingEnabled ||
      excludePaths.some(path => location.pathname.startsWith(path))
    ) {
      return;
    }

    const currentTime = Date.now();
    const timeOnPage = currentTime - pageEnterTimeRef.current;
    const title = pageTitle || document.title;
    
    // Track the page leave event for the previous page if it's not the first page load
    if (lastPathRef.current !== location.pathname) {
      trackEvent(AnalyticsEventType.PAGE_LEAVE, area, {
        path: lastPathRef.current,
        title: title,
        timeOnPage: Math.round(timeOnPage / 1000) // Convert to seconds
      });
    }
    
    // Track the new page view
    trackEvent(AnalyticsEventType.PAGE_VIEW, area, {
      path: location.pathname,
      title: title,
      referrer: document.referrer || lastPathRef.current
    });
    
    // Update refs for the new page
    pageEnterTimeRef.current = currentTime;
    lastPathRef.current = location.pathname;
    
    // Track page leave event when the user leaves the site
    const handleBeforeUnload = () => {
      const finalTimeOnPage = Date.now() - pageEnterTimeRef.current;
      
      trackEvent(AnalyticsEventType.PAGE_LEAVE, area, {
        path: location.pathname,
        title: title,
        timeOnPage: Math.round(finalTimeOnPage / 1000) // Convert to seconds
      });
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location, trackEvent, area, isTrackingEnabled, pageTitle, excludePaths]);
}
