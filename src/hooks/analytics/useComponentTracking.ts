import { useCallback } from 'react';
import { AnalyticsArea, useAnalytics } from '../../context/AnalyticsContext';

/**
 * Hook to track component interactions
 * @param area - The area of the application the component belongs to
 * @param componentName - The name of the component being tracked
 * @param additionalData - Additional data to include with all events from this component
 */
export const useComponentTracking = (
  area: AnalyticsArea,
  componentName: string,
  additionalData: Record<string, any> = {}
) => {
  const { trackEvent } = useAnalytics();
  
  /**
   * Track a component interaction event
   * @param actionName - The name of the action (e.g., 'click', 'hover', 'expand')
   * @param eventData - Additional data specific to this event
   */
  const trackComponentEvent = useCallback(
    (actionName: string, eventData: Record<string, any> = {}) => {
      // Log the component interaction for debugging, similar to page view logging
      console.log(`Tracking component interaction: ${componentName} - ${actionName} in ${area}`);
      
      // Include a better display name for the dashboard
      const featureName = componentName.includes('/') 
        ? componentName.split('/').pop() 
        : componentName;
        
      trackEvent('component_interaction', area, {
        componentName,
        featureName, // Add explicit feature name for dashboard display
        action: actionName,
        displayName: `${featureName} ${actionName}`, // Friendly display name
        ...additionalData,
        ...eventData,
      });
    },
    [area, componentName, additionalData, trackEvent]
  );

  return trackComponentEvent;
};
