import { useCallback } from 'react';
import { AnalyticsArea, useAnalytics } from '../../context/AnalyticsContext';

/**
 * Hook to track form interactions
 * @param area - The area of the application the form belongs to
 * @param formName - Optional name of the form being tracked (defaults to 'generic_form')
 * @param additionalData - Additional data to include with all events from this form
 */
export const useFormTracking = (
  area: AnalyticsArea,
  formName: string = 'generic_form',
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
      console.log(`Tracking form field event: ${formName}.${fieldName} - ${action} in ${area}`);
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
   * Track form start event
   * @param eventName - Name of the event (e.g., 'form_start')
   * @param eventData - Additional data about the form start
   */
  const trackFormStart = useCallback(
    (eventName: string, eventData: Record<string, any> = {}) => {
      console.log(`Tracking form start: ${formName} - ${eventName} in ${area}`);
      trackEvent('form_start', area, {
        formName,
        event: eventName,
        ...additionalData,
        ...eventData,
      });
    },
    [area, formName, additionalData, trackEvent]
  );

  /**
   * Track form step completion
   * @param eventName - Name of the step event (e.g., 'step_1_complete')
   * @param eventData - Additional data about the step
   */
  const trackFormStep = useCallback(
    (eventName: string, eventData: Record<string, any> = {}) => {
      console.log(`Tracking form step: ${formName} - ${eventName} in ${area}`);
      trackEvent('form_step', area, {
        formName,
        event: eventName,
        ...additionalData,
        ...eventData,
      });
    },
    [area, formName, additionalData, trackEvent]
  );

  /**
   * Track form completion
   * @param eventName - Name of the completion event (e.g., 'form_complete_success')
   * @param eventData - Additional data about the completion
   */
  const trackFormComplete = useCallback(
    (eventName: string, eventData: Record<string, any> = {}) => {
      console.log(`Tracking form completion: ${formName} - ${eventName} in ${area}`);
      trackEvent('form_complete', area, {
        formName,
        event: eventName,
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
      console.log(`Tracking form submission: ${formName} - success: ${success} in ${area}`);
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
      console.log(`Tracking form validation error: ${formName}.${fieldName} - ${errorMessage} in ${area}`);
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
    trackFormStart,
    trackFormStep,
    trackFormComplete,
    trackSubmit,
    trackValidationError,
  };
};
