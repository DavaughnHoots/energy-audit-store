// backend/src/types/analytics.ts

/**
 * Platform-wide metrics interface
 */
export interface PlatformMetrics {
    activeUsers: {
      daily: number;
      weekly: number;
      monthly: number;
      total: number;
      growth: number;  // Percentage growth from previous period
    };
    engagement: {
      avgSessionDuration: number;
      avgPageViews: number;
      bounceRate: number;
      returnRate: number;
    };
    energyImpact: {
      totalSavingsKwh: number;
      totalSavingsCost: number;
      carbonReduction: number;  // In metric tons
      averageSavingsPerUser: number;
    };
    productMetrics: {
      totalProducts: number;
      topCategories: Array<{
        category: string;
        views: number;
        conversions: number;
      }>;
      avgProductRating: number;
    };
    auditMetrics: {
      totalAudits: number;
      completionRate: number;
      averageScore: number;
      recommendationsImplemented: number;
    };
  }
  
  /**
   * User-specific analytics data
   */
  export interface UserAnalytics {
    userId: string;
    profile: {
      registrationDate: Date;
      lastActive: Date;
      completedAudits: number;
      totalSavings: number;
      achievementScore: number;
    };
    engagement: {
      sessionCount: number;
      totalTimeSpent: number;
      lastNSessions: Array<{
        date: Date;
        duration: number;
        actions: number;
      }>;
    };
    energyData: {
      baselineUsage: number;
      currentUsage: number;
      savingsPercentage: number;
      implementedRecommendations: number;
    };
    productInteractions: Array<{
      productId: string;
      views: number;
      lastViewed: Date;
      savedToList: boolean;
      purchased?: boolean;
    }>;
  }
  
  /**
   * Analytics event types
   */
  export type AnalyticsEventType =
    // User events
    | 'user_registration'
    | 'user_login'
    | 'user_logout'
    | 'profile_update'
    | 'preferences_change'
    
    // Page events
    | 'page_view'
    | 'page_exit'
    | 'scroll_depth'
    | 'time_on_page'
    
    // Product events
    | 'product_view'
    | 'product_search'
    | 'product_filter'
    | 'product_save'
    | 'product_share'
    | 'product_purchase'
    
    // Audit events
    | 'audit_start'
    | 'audit_step_complete'
    | 'audit_abandon'
    | 'audit_complete'
    | 'recommendation_view'
    | 'recommendation_implement'
    
    // Feature events
    | 'feature_interaction'
    | 'tool_usage'
    | 'calculator_usage'
    | 'report_download'
    
    // Error events
    | 'error_occurrence'
    | 'form_error'
    | 'api_error';
  
  /**
   * Analytics event data
   */
  export interface AnalyticsEvent {
    id: string;
    type: AnalyticsEventType;
    userId?: string;
    sessionId: string;
    timestamp: Date;
    properties: Record<string, any>;
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      referrer?: string;
      path?: string;
    };
  }
  
  /**
   * Session tracking interface
   */
  export interface AnalyticsSession {
    id: string;
    userId?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    events: AnalyticsEvent[];
    device: {
      type: 'desktop' | 'tablet' | 'mobile';
      browser: string;
      os: string;
    };
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };
  }
  
  /**
   * Time periods for analytics queries
   */
  export type AnalyticsTimeframe = 
    | 'hour'
    | 'day'
    | 'week'
    | 'month'
    | 'quarter'
    | 'year'
    | 'custom';
  
  /**
   * Analytics report configuration
   */
  export interface AnalyticsReportConfig {
    timeframe: AnalyticsTimeframe;
    metrics: string[];
    filters?: Record<string, any>;
    groupBy?: string[];
    sortBy?: string;
    limit?: number;
    format?: 'json' | 'csv' | 'pdf';
  }
  
  /**
   * Energy usage analytics
   */
  export interface EnergyAnalytics {
    userId: string;
    period: {
      start: Date;
      end: Date;
    };
    consumption: {
      total: number;
      byHour: number[];
      byDay: number[];
      byMonth: number[];
    };
    costs: {
      total: number;
      average: number;
      breakdown: Record<string, number>;
    };
    savings: {
      total: number;
      percentage: number;
      bySolution: Array<{
        recommendationId: string;
        amount: number;
      }>;
    };
    comparison: {
      similarHomes: number;
      regionalAverage: number;
      nationalAverage: number;
    };
  }
  
  /**
   * Product analytics
   */
  export interface ProductAnalytics {
    productId: string;
    views: {
      total: number;
      unique: number;
      byDate: Record<string, number>;
    };
    conversions: {
      total: number;
      rate: number;
      bySource: Record<string, number>;
    };
    recommendations: {
      appearanceCount: number;
      clickThroughRate: number;
      implementationRate: number;
    };
    feedback: {
      ratings: number[];
      averageRating: number;
      reviewCount: number;
    };
  }
  
  /**
   * Error tracking interface
   */
  export interface AnalyticsError {
    id: string;
    type: string;
    message: string;
    stack?: string;
    userId?: string;
    sessionId: string;
    timestamp: Date;
    context: {
      url?: string;
      component?: string;
      action?: string;
      additionalData?: Record<string, any>;
    };
    resolution?: {
      status: 'resolved' | 'investigating' | 'ignored';
      resolvedAt?: Date;
      resolution?: string;
    };
  }
  
  /**
   * Performance metrics interface
   */
  export interface PerformanceMetrics {
    apiLatency: {
      avg: number;
      p95: number;
      p99: number;
    };
    pageLoadTime: {
      avg: number;
      byPage: Record<string, number>;
    };
    errorRates: {
      api: number;
      client: number;
      byEndpoint: Record<string, number>;
    };
    resourceUtilization: {
      cpu: number;
      memory: number;
      storage: number;
    };
  }
  
  /**
   * Custom error types for analytics operations
   */
  export class AnalyticsError extends Error {
    constructor(
      message: string,
      public code: string,
      public details?: Record<string, any>
    ) {
      super(message);
      this.name = 'AnalyticsError';
    }
  }
  
  export class AnalyticsValidationError extends AnalyticsError {
    constructor(message: string, details?: Record<string, any>) {
      super(message, 'VALIDATION_ERROR', details);
      this.name = 'AnalyticsValidationError';
    }
  }
  
  export class AnalyticsTrackingError extends AnalyticsError {
    constructor(message: string, details?: Record<string, any>) {
      super(message, 'TRACKING_ERROR', details);
      this.name = 'AnalyticsTrackingError';
    }
  }