import { useCallback, useEffect, useRef } from 'react';
import { useAnalytics } from '../../context/AnalyticsContext';
import { AnalyticsEventType, AnalyticsArea, FormInteractionType } from '../../types/analytics';

interface UseFormTrackingOptions {
  formId: string;
  formName?: string;
  area?: AnalyticsArea;
  excludeFields?: string[];
  sensitiveFields?: string[];
  trackFocus?: boolean;
  trackBlur?: boolean;
  trackChange?: boolean;
  trackSubmit?: boolean;
  trackValidation?: boolean;
}

/**
 * Hook to track form interactions for the pilot study
 * Returns handlers that can be attached to form elements
 */
export default function useFormTracking({
  formId,
  formName,
  area = AnalyticsArea.GENERAL,
  excludeFields = [],
  sensitiveFields = [],
  trackFocus = true,
  trackBlur = true,
  trackChange = true,
  trackSubmit = true,
  trackValidation = true
}: UseFormTrackingOptions) {
  const { trackEvent, isTrackingEnabled } = useAnalytics();
  const fieldFocusTimeRef = useRef<Record<string, number>>({});
  const formValuesRef = useRef<Record<string, any>>({});
  const formStartTimeRef = useRef<number>(Date.now());
  const visitedFieldsRef = useRef<Set<string>>(new Set());
  
  // Check if a field should be excluded from tracking
  const isExcludedField = useCallback((fieldId: string) => {
    return excludeFields.some(pattern => {
      // Support string patterns only
      return fieldId.includes(pattern);
    });
  }, [excludeFields]);
  
  // Check if a field value should be redacted
  const shouldRedactValue = useCallback((fieldId: string) => {
    return sensitiveFields.some(pattern => {
      // Support string patterns only
      return fieldId.includes(pattern);
    });
  }, [sensitiveFields]);
  
  // Track focus events
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!isTrackingEnabled || !trackFocus) return;
    
    const fieldId = event.target.id || event.target.name;
    if (!fieldId || isExcludedField(fieldId)) return;
    
    // Record the time when the field was focused
    fieldFocusTimeRef.current[fieldId] = Date.now();
    
    // Add to visited fields
    visitedFieldsRef.current.add(fieldId);
    
    // Track event
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: 'focus',
      formId,
      formName,
      fieldId,
      fieldType: event.target.type || 'unknown'
    });
  }, [isTrackingEnabled, trackFocus, trackEvent, area, formId, formName, isExcludedField]);
  
  // Track blur events
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!isTrackingEnabled || !trackBlur) return;
    
    const fieldId = event.target.id || event.target.name;
    if (!fieldId || isExcludedField(fieldId)) return;
    
    // Calculate time spent on field
    const focusTime = fieldFocusTimeRef.current[fieldId] || Date.now();
    const timeOnField = Date.now() - focusTime;
    
    // Get field value (redact sensitive data)
    const fieldValue = shouldRedactValue(fieldId) ? '[REDACTED]' : event.target.value;
    
    // Track event
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: 'blur',
      formId,
      formName,
      fieldId,
      fieldType: event.target.type || 'unknown',
      value: fieldValue,
      timeOnField: Math.round(timeOnField / 1000) // seconds
    });
    
    // Clear focus time
    delete fieldFocusTimeRef.current[fieldId];
  }, [isTrackingEnabled, trackBlur, trackEvent, area, formId, formName, isExcludedField, shouldRedactValue]);
  
  // Track change events
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!isTrackingEnabled || !trackChange) return;
    
    const fieldId = event.target.id || event.target.name;
    if (!fieldId || isExcludedField(fieldId)) return;
    
    // Get field value (redact sensitive data)
    const fieldValue = shouldRedactValue(fieldId) ? '[REDACTED]' : event.target.value;
    
    // Track event
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: 'change',
      formId,
      formName,
      fieldId,
      fieldType: event.target.type || 'unknown',
      value: fieldValue
    });
    
    // Update form values
    formValuesRef.current[fieldId] = event.target.value;
  }, [isTrackingEnabled, trackChange, trackEvent, area, formId, formName, isExcludedField, shouldRedactValue]);
  
  // Track form submission
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>, validationErrors?: string[]) => {
    if (!isTrackingEnabled || !trackSubmit) return;
    
    // Calculate form completion time
    const formCompletionTime = Date.now() - formStartTimeRef.current;
    
    // Track event
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: validationErrors && validationErrors.length > 0 ? 'error' : 'submit',
      formId,
      formName,
      validationErrors
    });
    
    // Reset start time
    formStartTimeRef.current = Date.now();
  }, [isTrackingEnabled, trackSubmit, trackEvent, area, formId, formName]);
  
  // Reset form
  const handleReset = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    if (!isTrackingEnabled) return;
    
    // Track event
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: 'reset',
      formId,
      formName
    });
    
    // Reset tracking state
    fieldFocusTimeRef.current = {};
    formValuesRef.current = {};
    formStartTimeRef.current = Date.now();
    visitedFieldsRef.current.clear();
  }, [isTrackingEnabled, trackEvent, area, formId, formName]);
  
  // Track validation errors at the field level
  const trackFieldValidation = useCallback((fieldId: string, isValid: boolean, errors?: string[]) => {
    if (!isTrackingEnabled || !trackValidation || isExcludedField(fieldId)) return;
    
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: isValid ? 'success' : 'error',
      formId,
      formName,
      fieldId,
      validationErrors: !isValid ? errors : undefined
    });
  }, [isTrackingEnabled, trackValidation, trackEvent, area, formId, formName, isExcludedField]);
  
  // Track when the advanced options are toggled
  const trackAdvancedToggle = useCallback((isAdvancedShown: boolean) => {
    if (!isTrackingEnabled) return;
    
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: 'custom',
      formId,
      formName,
      value: isAdvancedShown ? 'advanced-on' : 'advanced-off'
    });
  }, [isTrackingEnabled, trackEvent, area, formId, formName]);
  
  // Track when a particular section is navigated to
  const trackSectionChange = useCallback((sectionId: string, sectionName?: string) => {
    if (!isTrackingEnabled) return;
    
    trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
      action: 'navigation',
      formId,
      formName,
      fieldId: sectionId,
      value: sectionName || sectionId
    });
  }, [isTrackingEnabled, trackEvent, area, formId, formName]);
  
  // Track form completion progress when component unmounts
  useEffect(() => {
    // Cleanup function
    return () => {
      if (!isTrackingEnabled) return;
      
      const fieldCount = Object.keys(formValuesRef.current).length;
      const visitedCount = visitedFieldsRef.current.size;
      
      if (fieldCount > 0) {
        // Track form completion state on unmount
        const completionPercent = fieldCount > 0 ? Math.round((visitedCount / fieldCount) * 100) : 0;
        
        trackEvent(AnalyticsEventType.FORM_INTERACTION, area, {
          action: 'completion',
          formId,
          formName,
          completionPercent,
          visitedFields: Array.from(visitedFieldsRef.current),
          fieldCount
        });
      }
    };
  }, [isTrackingEnabled, trackEvent, area, formId, formName]);
  
  // Return handlers to be attached to form elements
  return {
    handleFocus,
    handleBlur,
    handleChange,
    handleSubmit,
    handleReset,
    trackFieldValidation,
    trackAdvancedToggle,
    trackSectionChange
  };
}
