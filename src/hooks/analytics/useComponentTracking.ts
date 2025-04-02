import { useCallback } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AnalyticsEventType, AnalyticsArea, ComponentInteractionType } from '../../types/analytics';

interface UseComponentTrackingOptions {
  area?: AnalyticsArea;
  componentPrefix?: string;
  excludeComponents?: string[];
}

/**
 * Hook for tracking component interactions in the pilot study
 */
export default function useComponentTracking({
  area = AnalyticsArea.GENERAL,
  componentPrefix = '',
  excludeComponents = []
}: UseComponentTrackingOptions = {}) {
  const { trackEvent, isTrackingEnabled } = useAnalytics();

  // Check if a component should be excluded from tracking
  const isExcludedComponent = useCallback((componentId: string) => {
    return excludeComponents.some(pattern => {
      return componentId.includes(pattern);
    });
  }, [excludeComponents]);

  // Helper to format component IDs
  const formatComponentId = useCallback((id: string) => {
    if (!id) return id;
    return componentPrefix ? `${componentPrefix}-${id}` : id;
  }, [componentPrefix]);

  // Track button clicks
  const trackButtonClick = useCallback((
    buttonId: string,
    buttonText?: string,
    additionalData?: Record<string, any>
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(buttonId)) return;

    const formattedId = formatComponentId(buttonId);

    trackEvent(AnalyticsEventType.BUTTON_CLICK, area, {
      componentId: formattedId,
      componentType: 'button',
      buttonText,
      ...additionalData
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  // Track link clicks
  const trackLinkClick = useCallback((
    linkId: string,
    href?: string,
    linkText?: string
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(linkId)) return;

    const formattedId = formatComponentId(linkId);

    trackEvent(AnalyticsEventType.LINK_CLICK, area, {
      componentId: formattedId,
      componentType: 'link',
      href,
      linkText
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  // Track tab changes
  const trackTabChange = useCallback((
    tabId: string,
    tabName: string,
    previousTab?: string
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(tabId)) return;

    const formattedId = formatComponentId(tabId);

    trackEvent(AnalyticsEventType.COMPONENT_INTERACTION, area, {
      componentId: formattedId,
      componentType: 'tab',
      interactionType: ComponentInteractionType.TAB_CHANGE,
      tabName,
      previousTab
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  // Track modal opens
  const trackModalOpen = useCallback((
    modalId: string,
    modalTitle?: string,
    source?: string
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(modalId)) return;

    const formattedId = formatComponentId(modalId);

    trackEvent(AnalyticsEventType.COMPONENT_INTERACTION, area, {
      componentId: formattedId,
      componentType: 'modal',
      interactionType: ComponentInteractionType.MODAL_OPEN,
      modalTitle,
      source
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  // Track modal closes
  const trackModalClose = useCallback((
    modalId: string,
    modalTitle?: string,
    timeOpen?: number
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(modalId)) return;

    const formattedId = formatComponentId(modalId);

    trackEvent(AnalyticsEventType.COMPONENT_INTERACTION, area, {
      componentId: formattedId,
      componentType: 'modal',
      interactionType: ComponentInteractionType.MODAL_CLOSE,
      modalTitle,
      timeOpen
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  // Track dropdown interactions
  const trackDropdownInteraction = useCallback((
    dropdownId: string,
    action: 'open' | 'select' | 'close',
    selectedValue?: string
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(dropdownId)) return;

    const formattedId = formatComponentId(dropdownId);
    
    const interactionType = action === 'open' 
      ? ComponentInteractionType.DROPDOWN_OPEN 
      : action === 'select' 
        ? ComponentInteractionType.DROPDOWN_SELECT 
        : ComponentInteractionType.COLLAPSE;

    trackEvent(AnalyticsEventType.COMPONENT_INTERACTION, area, {
      componentId: formattedId,
      componentType: 'dropdown',
      interactionType,
      selectedValue
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  // Track expand/collapse
  const trackExpandCollapse = useCallback((
    componentId: string,
    isExpanded: boolean,
    componentType: string = 'collapsible'
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(componentId)) return;

    const formattedId = formatComponentId(componentId);

    trackEvent(AnalyticsEventType.COMPONENT_INTERACTION, area, {
      componentId: formattedId,
      componentType,
      interactionType: isExpanded ? ComponentInteractionType.EXPAND : ComponentInteractionType.COLLAPSE,
      value: isExpanded ? 'expanded' : 'collapsed'
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  // Generic component interaction tracker
  const trackComponentInteraction = useCallback((
    componentId: string,
    componentType: string,
    interactionType: ComponentInteractionType,
    additionalData?: Record<string, any>
  ) => {
    if (!isTrackingEnabled || isExcludedComponent(componentId)) return;

    const formattedId = formatComponentId(componentId);

    trackEvent(AnalyticsEventType.COMPONENT_INTERACTION, area, {
      componentId: formattedId,
      componentType,
      interactionType,
      ...additionalData
    });
  }, [isTrackingEnabled, trackEvent, area, isExcludedComponent, formatComponentId]);

  return {
    trackButtonClick,
    trackLinkClick,
    trackTabChange,
    trackModalOpen,
    trackModalClose,
    trackDropdownInteraction,
    trackExpandCollapse,
    trackComponentInteraction
  };
}
