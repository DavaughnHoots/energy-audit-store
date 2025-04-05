import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnalyticsArea, useAnalytics } from '../../context/AnalyticsContext';

/**
 * Hook to automatically track page views when a component mounts or when the URL changes
 * @param area - The area of the application being viewed
 * @param additionalData - Additional data to include with the page view event
 */
export const usePageTracking = (
  area: AnalyticsArea,
  additionalData: Record<string, any> = {}
) => {
  const location = useLocation();
  const { trackEvent } = useAnalytics();
  const firstRenderRef = useRef(true);

  useEffect(() => {
    // Track the page view
    trackEvent('page_view', area, {
      path: location.pathname,
      search: location.search,
      title: document.title,
      referrer: document.referrer,
      ...additionalData,
    });

    // We set firstRenderRef to false to track that this is no longer the first render
    firstRenderRef.current = false;
  }, [location.pathname, location.search, area, trackEvent]);

  return null;
};
