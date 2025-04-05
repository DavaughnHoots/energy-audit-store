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
      trackEvent('component_interaction', area, {
        componentName,
        action: actionName,
        ...additionalData,
        ...eventData,
      });
    },
    [area, componentName, additionalData, trackEvent]
  );

  return trackComponentEvent;
};
