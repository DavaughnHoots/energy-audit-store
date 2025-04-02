/**
 * Types for analytics functionality in the frontend
 */

// Areas of the application for analytics tracking
export enum AnalyticsArea {
  GLOBAL = 'global',
  GENERAL = 'general',
  DASHBOARD = 'dashboard',
  ENERGY_AUDIT = 'energy_audit',
  AUDIT = 'audit', // Alias for ENERGY_AUDIT
  SETTINGS = 'settings',
  USER_PROFILE = 'user_profile',
  PRODUCTS = 'products',
  REPORTS = 'reports',
  RECOMMENDATIONS = 'recommendations',
  EDUCATION = 'education',
  AUTHENTICATION = 'authentication'
}

// Form interaction types
export enum FormInteractionType {
  FOCUS = 'focus',
  BLUR = 'blur',
  CHANGE = 'change',
  SUBMIT = 'submit',
  VALIDATION_ERROR = 'validation_error',
  VALIDATION_SUCCESS = 'validation_success',
  COMPLETION = 'completion',
  FIELD_ERROR = 'field_error',
  FIELD_SUCCESS = 'field_success',
  // Additional types needed by hooks
  FIELD_FOCUS = 'field_focus',
  FIELD_BLUR = 'field_blur',
  FIELD_CHANGE = 'field_change',
  FORM_SUBMIT = 'form_submit',
  FORM_RESET = 'form_reset',
  ADVANCED_TOGGLE = 'advanced_toggle',
  SECTION_CHANGE = 'section_change'
}

// Component interaction types
export enum ComponentInteractionType {
  CLICK = 'click',
  HOVER = 'hover',
  SCROLL = 'scroll',
  DROPDOWN_OPEN = 'dropdown_open',
  DROPDOWN_SELECT = 'dropdown_select',
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',
  TAB_SWITCH = 'tab_switch',
  TAB_CHANGE = 'tab_change', // Alias for TAB_SWITCH
  EXPAND = 'expand',
  COLLAPSE = 'collapse',
  EXPAND_COLLAPSE = 'expand_collapse', // Combined operation
  DRAG = 'drag',
  DROP = 'drop'
}

// Component interaction event interface
export interface ComponentInteractionEvent extends AnalyticsEvent {
  eventType: AnalyticsEventType.COMPONENT_INTERACTION;
  data: {
    componentId?: string;
    componentType: string;
    interactionType: ComponentInteractionType;
    value?: string | number | boolean;
    details?: Record<string, any>;
  };
}

// These should match the backend enum values in backend/types/analytics.ts
export enum AnalyticsEventType {
  // Component interaction events (missing in original)
  COMPONENT_INTERACTION = 'component_interaction',
  // Page-related events
  PAGE_VIEW = 'page_view',
  PAGE_LEAVE = 'page_leave',
  
  // Session events
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  
  // User interaction events
  BUTTON_CLICK = 'button_click',
  LINK_CLICK = 'link_click',
  FORM_INTERACTION = 'form_interaction',
  
  // Feature usage events
  FEATURE_USAGE = 'feature_usage',
  
  // Pilot study specific events
  ENERGY_AUDIT_STARTED = 'energy_audit_started',
  ENERGY_AUDIT_COMPLETED = 'energy_audit_completed',
  ENERGY_AUDIT_SECTION_COMPLETED = 'energy_audit_section_completed',
  
  // Product recommendation events
  PRODUCT_VIEW = 'product_view',
  PRODUCT_COMPARE = 'product_compare',
  
  // Error events
  ERROR_OCCURRED = 'error',
  
  // Custom events
  CUSTOM = 'custom'
}

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  area: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface PageViewEvent extends AnalyticsEvent {
  eventType: AnalyticsEventType.PAGE_VIEW;
  data: {
    path: string;
    title: string;
    referrer?: string;
  };
}

export interface ButtonClickEvent extends AnalyticsEvent {
  eventType: AnalyticsEventType.BUTTON_CLICK;
  data: {
    buttonId?: string;
    buttonText?: string;
    buttonType?: string;
    targetUrl?: string;
  };
}

export interface FormInteractionEvent extends AnalyticsEvent {
  eventType: AnalyticsEventType.FORM_INTERACTION;
  data: {
    formId: string;
    formName?: string;
    action: 'focus' | 'blur' | 'submit' | 'error' | 'success' | 'change' | 'completion';
    fieldId?: string;
    fieldName?: string;
    fieldType?: string;
    value?: string; // Only non-sensitive values should be captured
    errorMessage?: string;
  };
}

export interface FeatureUsageEvent extends AnalyticsEvent {
  eventType: AnalyticsEventType.FEATURE_USAGE;
  data: {
    featureId: string;
    featureName: string;
    action: string;
    details?: Record<string, any>;
  };
}

export interface EnergyAuditEvent extends AnalyticsEvent {
  eventType: 
    | AnalyticsEventType.ENERGY_AUDIT_STARTED 
    | AnalyticsEventType.ENERGY_AUDIT_COMPLETED 
    | AnalyticsEventType.ENERGY_AUDIT_SECTION_COMPLETED;
  data: {
    auditId?: string;
    sectionName?: string;
    sectionId?: string;
    timeSpent?: number; // In seconds
    completionPercent?: number;
    isRetry?: boolean;
  };
}

export interface ProductEvent extends AnalyticsEvent {
  eventType: AnalyticsEventType.PRODUCT_VIEW | AnalyticsEventType.PRODUCT_COMPARE;
  data: {
    productId: string;
    productName?: string;
    productCategory?: string;
    recommended?: boolean;
    comparedWith?: string[]; // For comparison events
    source?: string; // Where the user came from
  };
}

export interface ErrorEvent extends AnalyticsEvent {
  eventType: AnalyticsEventType.ERROR_OCCURRED;
  data: {
    errorType: string;
    errorMessage: string;
    errorStack?: string;
    componentName?: string;
    url?: string;
  };
}

// Configuration for page tracking
export interface PageTrackingConfig {
  includeReferrer: boolean;
  enablePageLeaveEvents: boolean;
  excludePaths: string[];
}

// Configuration for form tracking
export interface FormTrackingConfig {
  trackFocus: boolean;
  trackBlur: boolean;
  trackChanges: boolean;
  trackSubmits: boolean;
  trackCompletionRate: boolean;
  excludedFieldTypes: string[];
  sensitiveFields: string[];
}

// Configuration for component interaction tracking
export interface ComponentTrackingConfig {
  trackButtonClicks: boolean;
  trackLinkClicks: boolean;
  trackModalInteractions: boolean;
  trackDropdownInteractions: boolean;
  trackTabSwitches: boolean;
  excludedButtonClasses: string[];
  excludedLinkPatterns: string[];
}

// Main analytics configuration
export interface AnalyticsConfig {
  enabled: boolean;
  sessionTimeout: number; // In minutes
  dataRetentionPeriod: number; // In days
  pageTracking: PageTrackingConfig;
  formTracking: FormTrackingConfig;
  componentTracking: ComponentTrackingConfig;
  consentRequired: boolean;
  piiDataHandling: 'none' | 'hash' | 'redact';
}

// Default configuration that will be used if not overridden
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: false, // Disabled by default until user consent
  sessionTimeout: 30, // 30 minutes
  dataRetentionPeriod: 90, // 90 days
  pageTracking: {
    includeReferrer: true,
    enablePageLeaveEvents: true,
    excludePaths: [
      '/api/',
      '/auth/reset-password',
      '/profile/settings'
    ]
  },
  formTracking: {
    trackFocus: true,
    trackBlur: true,
    trackChanges: true,
    trackSubmits: true,
    trackCompletionRate: true,
    excludedFieldTypes: ['password', 'hidden'],
    sensitiveFields: ['email', 'phone', 'address', 'name', 'credit-card']
  },
  componentTracking: {
    trackButtonClicks: true,
    trackLinkClicks: true,
    trackModalInteractions: true,
    trackDropdownInteractions: true,
    trackTabSwitches: true,
    excludedButtonClasses: ['btn-ignore-analytics'],
    excludedLinkPatterns: [
      'mailto:*',
      'tel:*',
      'file:*'
    ]
  },
  consentRequired: true,
  piiDataHandling: 'redact'
};
