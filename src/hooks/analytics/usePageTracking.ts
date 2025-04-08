import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnalyticsArea, useAnalytics } from '../../context/AnalyticsContext';

// Debounce timeout in milliseconds
const DEBOUNCE_DELAY = 600;

/**
 * Hook to automatically track page views when a component mounts or when the URL changes
 * Uses debouncing to prevent duplicate events during React re-renders
 * 
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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastTrackedPath, setLastTrackedPath] = useState<string>('');
  const [lastTrackedSearch, setLastTrackedSearch] = useState<string>('');
  
  // Generate an event ID to help with deduplication
  const eventIdRef = useRef(`pageview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    // Clear any pending debounce timer when component unmounts
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Build a unique key for this location
    const fullPath = `${location.pathname}${location.search}`;
    
    // Don't track if we've already tracked this exact location
    if (!firstRenderRef.current && 
        fullPath === `${lastTrackedPath}${lastTrackedSearch}`) {
      return;
    }
    
    // Clear any pending tracking
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a debounce timer to track the page view after delay
    debounceTimerRef.current = setTimeout(() => {
      // Log the tracked event to help with debugging
      console.log(`Tracking page view: ${location.pathname}${location.search} in ${area}`);
      
      // Create a friendly page name for dashboard display
      // Map the area to a human-readable name
      const areaDisplayNames: Record<string, string> = {
        'dashboard': 'User Dashboard',
        'energy_audit': 'Energy Audit Form',
        'reports': 'Interactive Report',
        'settings': 'User Settings',
        'auth': 'Authentication',
        'products': 'Product Catalog',
        'community': 'Community',
        'education': 'Education Resources',
        'admin': 'Admin Dashboard',
        'debug': 'Debug Page'
      };
      
      // Generate a friendly page name based on the path and area
      let pageName = areaDisplayNames[area as string] || String(area);
      
      // If there's a specific path, add it to create a more specific page name
      if (location.pathname !== '/' && location.pathname !== `/${area}`) {
        const pathSegments = location.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 1) {
          // Safe access to last segment with fallback
          const lastSegmentIndex = pathSegments.length - 1;
          if (lastSegmentIndex >= 0 && pathSegments[lastSegmentIndex]) {
            const lastSegment = pathSegments[lastSegmentIndex]
              .replace(/-/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase()); // Convert to title case
            pageName += `: ${lastSegment}`;
          }
        }
      }
      
      // If we have a document title, use it as a fallback
      if (!pageName && document.title) {
        pageName = document.title;
      }
      
      // Track the page view
      trackEvent('page_view', area, {
        path: location.pathname,
        search: location.search,
        title: document.title,
        referrer: document.referrer,
        eventId: eventIdRef.current, // Add unique event ID for deduplication
        pageName, // Add explicit page name for dashboard display
        displayName: pageName, // Alternative name for dashboard display
        ...additionalData,
      });
      
      // Update last tracked location
      setLastTrackedPath(location.pathname);
      setLastTrackedSearch(location.search);
      
      // Update the event ID for next time
      eventIdRef.current = `pageview_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Reset the debounce timer
      debounceTimerRef.current = null;
    }, DEBOUNCE_DELAY);
    
    // We set firstRenderRef to false to track that this is no longer the first render
    firstRenderRef.current = false;
  }, [location.pathname, location.search, area, trackEvent, additionalData, lastTrackedPath, lastTrackedSearch]);

  return null;
};
