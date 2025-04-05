import { useCallback } from 'react';
import { AnalyticsArea, useAnalytics } from '../../context/AnalyticsContext';

/**
 * Hook to track component interactions with granular feature tracking
 *
 * @param area - The area of the application the component belongs to
 * @param componentName - The name of the component being tracked
 *                        Use granular feature naming: "ComponentName_FeatureAction"
 *                        Examples: "ProductsPage_Search", "EnergyAuditForm_Navigation"
 * @param additionalData - Additional data to include with all events from this component
 *
 * @returns A function to track specific actions within the feature
 */
export const useComponentTracking = (
  area: AnalyticsArea,
  componentName: string,
  additionalData: Record<string, any> = {}
) => {
  const { trackEvent } = useAnalytics();
  
  /**
   * Track a component interaction event
   * @param actionName - The name of the action (e.g., 'click', 'change', 'submit')
   * @param eventData - Additional data specific to this event
   */
  const trackComponentEvent = useCallback(
    (actionName: string, eventData: Record<string, any> = {}) => {
      // Log the component interaction with the granular feature name
      console.log(`Tracking component interaction: ${componentName} - ${actionName} in ${area}`);
      
      // Extract the base component name and feature from the componentName if it uses the new format
      let baseComponent = componentName;
      let featureName = componentName;
      
      // If using the new [ComponentName]_[FeatureAction] format
      if (componentName.includes('_')) {
        const parts = componentName.split('_');
        baseComponent = parts[0] || componentName; // Default to componentName if parts[0] is empty
        featureName = componentName; // Keep the full feature name like "ProductsPage_Search"
      } else {
        // Legacy format, derive a simple feature name
        if (componentName.includes('/')) {
          const parts = componentName.split('/');
          const lastPart = parts[parts.length - 1];
          featureName = lastPart || componentName; // Default to componentName if lastPart is empty
        } else {
          featureName = componentName;
        }
      }
      
      trackEvent('component_interaction', area, {
        componentName: baseComponent, // For backward compatibility
        featureName,    // The granular feature name for dashboard display
        action: actionName,
        displayName: featureName, // Just use the feature name as the display name
        ...additionalData,
        ...eventData,
      });
    },
    [area, componentName, additionalData, trackEvent]
  );

  return trackComponentEvent;
};
