/**
 * Type definitions for analytics functionality in the backend
 */

// Analytics Event Model
export interface AnalyticsEventModel {
  id: string;
  sessionId: string;
  userId?: string | null;
  eventType: string;
  area: string;
  timestamp: Date;
  data: Record<string, any>;
  createdAt: Date;
}

// Analytics Session Model
export interface AnalyticsSessionModel {
  id: string;
  userId?: string | null;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  userAgent?: string | null;
  deviceType?: string | null;
  screenSize?: string | null;
  referrer?: string | null;
  isActive: boolean;
  eventsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Consent Model
export interface AnalyticsConsentModel {
  id: string;
  userId: string;
  status: 'not_asked' | 'granted' | 'denied' | 'withdrawn';
  consentDate: Date;
  consentVersion: string;
  dataUsageAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Feature Metrics Model
export interface AnalyticsFeatureMetricsModel {
  id: number;
  featureId: string;
  featureCategory?: string | null;
  usageCount: number;
  uniqueUsers: number;
  lastUsed?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Types for API endpoints

/**
 * Save Analytics Events Request
 */
export interface SaveEventsRequest {
  sessionId: string;
  events: Array<{
    eventType: string;
    area: string;
    timestamp: string;
    data?: Record<string, any>;
  }>;
}

/**
 * Save Analytics Events Response
 */
export interface SaveEventsResponse {
  success: boolean;
  eventsProcessed: number;
}

/**
 * Update Consent Request
 */
export interface UpdateConsentRequest {
  consent: boolean;
}

/**
 * Update Consent Response
 */
export interface UpdateConsentResponse {
  success: boolean;
  status: string;
}

/**
 * Get Metrics Request
 */
export interface GetMetricsRequest {
  startDate?: string;
  endDate?: string;
  filters?: {
    areas?: string[];
    eventTypes?: string[];
    features?: string[];
    userIds?: string[];
  };
}

/**
 * Page Views by Area Metric
 */
export interface PageViewsByAreaMetric {
  area: string;
  count: number;
}

/**
 * Feature Usage Metric
 */
export interface FeatureUsageMetric {
  feature: string;
  count: number;
}

/**
 * Analytics Metrics
 */
export interface AnalyticsMetrics {
  totalSessions: number;
  avgSessionDuration: number;
  formCompletions: number;
  pageViewsByArea: PageViewsByAreaMetric[];
  featureUsage: FeatureUsageMetric[];
}

/**
 * Date Range
 */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Get Metrics Response
 */
export interface GetMetricsResponse {
  success: boolean;
  metrics: AnalyticsMetrics;
  dateRange: DateRange;
}
