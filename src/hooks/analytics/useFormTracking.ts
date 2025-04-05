import { useCallback } from 'react';
import { AnalyticsArea, useAnalytics } from '../../context/AnalyticsContext';

/**
 * Hook to track form interactions
 * @param area - The area of the application the form belongs to
 * @param formName - The name of the form being tracked
 * @param additionalData - Additional data to include with all events from this form
 */
export const useFormTracking = (
  area: AnalyticsArea,
  formName: string,
  additionalData: Record<string, any> = {}
) => {
  const { trackEvent } = useAnalytics();

  /**
   * Track a form field interaction
   * @param fieldName - The name of the field being interacted with
   * @param action - The action (e.g., 'focus', 'blur', 'change', 'error')
   * @param eventData - Additional data specific to this event
   */
  const trackFieldEvent = useCallback(
    (fieldName: string, action: string, eventData: Record<string, any> = {}) => {
      trackEvent('form_interaction', area, {
        formName,
        fieldName,
        action,
        ...additionalData,
        ...eventData,
      });
    },
    [area, formName, additionalData, trackEvent]
  );

  /**
   * Track a form submission
   * @param success - Whether the submission was successful
   * @param eventData - Additional data about the submission
   */
  const trackSubmit = useCallback(
    (success: boolean, eventData: Record<string, any> = {}) => {
      trackEvent('form_interaction', area, {
        formName,
        action: 'submit',
        success,
        ...additionalData,
        ...eventData,
      });
    },
    [area, formName, additionalData, trackEvent]
  );

  /**
   * Track a form validation error
   * @param fieldName - The name of the field with the validation error
   * @param errorMessage - The validation error message
   * @param eventData - Additional data about the validation error
   */
  const trackValidationError = useCallback(
    (fieldName: string, errorMessage: string, eventData: Record<string, any> = {}) => {
      trackEvent('form_interaction', area, {
        formName,
        fieldName,
        action: 'validation_error',
        errorMessage,
        ...additionalData,
        ...eventData,
      });
    },
    [area, formName, additionalData, trackEvent]
  );

  return {
    trackFieldEvent,
    trackSubmit,
    trackValidationError,
  };
};
