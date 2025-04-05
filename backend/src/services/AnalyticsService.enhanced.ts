// backend/src/services/AnalyticsService.display-fix.ts
// Fixed version to properly extract page names and feature names for dashboard display

import pkg from 'pg';
const { Pool } = pkg;

interface UserMetrics {
  totalAudits: number;
  completedAudits: number;
  productViews: number;
  recommendationsViewed: number;
  recommendationsActioned: number;
  estimatedSavings: number;
  actualSavings: number;
}

interface PlatformMetrics {
  activeUsers: number;
  newUsers: number;
  totalAudits: number;
  productEngagement: Record<string, number>;
  averageSavings: number;
  topProducts: Array<{id: string, views: number}>;
  mostVisitedPages: Array<{page: string, count: number}>;
  mostUsedFeatures: Array<{feature: string, count: number}>;
}

export class AnalyticsService {
  private pool: any; // Using any to bypass TypeScript errors with pg pool

  constructor(pool: any) {
    this.pool = pool;
  }

  /**
   * Create or update an analytics session
   */
  async createOrUpdateSession(sessionId: string, userId?: string): Promise<void> {
    try {
      const existingSession = await this.pool.query(
        'SELECT * FROM analytics_sessions WHERE id = $1',
        [sessionId]
      );

      if (existingSession.rows.length === 0) {
        // Create new session
        await this.pool.query(
          'INSERT INTO analytics_sessions (id, user_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
          [sessionId, userId || null]
        );
      } else {
        // Update existing session
        await this.pool.query(
          'UPDATE analytics_sessions SET updated_at = NOW(), user_id = COALESCE($1, user_id) WHERE id = $2',
          [userId || null, sessionId]
        );
      }
    } catch (error) {
      console.error('Error in createOrUpdateSession:', error);
      throw error;
    }
  }

  /**
   * Track an analytics event with direct database write
   */
  async trackEvent(sessionId: string, eventType: string, area: string, data: any): Promise<void> {
    try {
      // Ensure the session exists/is updated
      await this.createOrUpdateSession(sessionId);
      
      // Get the user_id from the session
      const session = await this.pool.query(
        'SELECT user_id FROM analytics_sessions WHERE id = $1',
        [sessionId]
      );
      
      const userId = session.rows.length > 0 ? session.rows[0].user_id : null;
      
      // Write event directly to the database
      await this.pool.query(
        'INSERT INTO analytics_events (id, session_id, user_id, event_type, area, data, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [this.generateUUID(), sessionId, userId, eventType, area, JSON.stringify(data)]
      );
    } catch (error) {
      console.error('Error in trackEvent:', error);
      throw error;
    }
  }

  async getUserMetrics(userId: string, timeframe: string): Promise<UserMetrics> {
    const timeframeClause = this.getTimeframeClause(timeframe);
    
    try {
      const [auditStats, productStats] = await Promise.all([
        this.getAuditStats(userId, timeframeClause),
        this.getProductEngagementStats(userId, timeframeClause)
      ]);

      return {
        ...auditStats,
        ...productStats,
        // Default values for savings since the table doesn't exist
        estimatedSavings: 0,
        actualSavings: 0
      };
    } catch (error) {
      console.error('Error in getUserMetrics:', error);
      // Return default metrics if there's an error
      return {
        totalAudits: 0,
        completedAudits: 0,
        productViews: 0,
        recommendationsViewed: 0,
        recommendationsActioned: 0,
        estimatedSavings: 0,
        actualSavings: 0
      };
    }
  }

  async getPlatformMetrics(timeframe: string): Promise<PlatformMetrics> {
    const timeframeClause = this.getTimeframeClause(timeframe);

    try {
      const [
        userStats, 
        auditStats, 
        productStats, 
        mostVisitedPages, 
        mostUsedFeatures
      ] = await Promise.all([
        this.getUserStats(timeframeClause),
        this.getAggregateAuditStats(timeframeClause),
        this.getAggregateProductStats(timeframeClause),
        this.getMostVisitedPages(timeframeClause),
        this.getMostUsedFeatures(timeframeClause)
      ]);

      return {
        ...userStats,
        ...auditStats,
        ...productStats,
        mostVisitedPages,
        mostUsedFeatures,
        // Default value for averageSavings since we don't have user_savings table
        averageSavings: 0
      };
    } catch (error) {
      console.error('Error in getPlatformMetrics:', error);
      // Return default metrics if there's an error
      return {
        activeUsers: 0,
        newUsers: 0,
        totalAudits: 0,
        productEngagement: {},
        averageSavings: 0,
        topProducts: [],
        mostVisitedPages: [],
        mostUsedFeatures: []
      };
    }
  }

  /**
   * Get most visited pages with proper page names
   */
  private async getMostVisitedPages(timeframeClause: string) {
    try {
      // First try to get pages with pageName or displayName
      const result = await this.pool.query(`
        SELECT 
          COALESCE(
            data->>'pageName',
            data->>'displayName',
            data->>'title',
            'Unknown Page'
          ) as page_name,
          COUNT(*) as view_count
        FROM analytics_events
        WHERE event_type = 'page_view'
        AND created_at ${timeframeClause}
        GROUP BY page_name
        ORDER BY view_count DESC
        LIMIT 10
      `);

      return result.rows.map(row => ({
        page: row.page_name,
        count: parseInt(row.view_count)
      }));
    } catch (error) {
      console.error('Error in getMostVisitedPages:', error);
      return [];
    }
  }

  /**
   * Get most used features with proper feature names
   */
  private async getMostUsedFeatures(timeframeClause: string) {
    try {
      // Try to get feature names from component interactions
      const result = await this.pool.query(`
        SELECT 
          COALESCE(
            data->>'featureName',
            data->>'displayName',
            data->>'componentName',
            CONCAT(data->>'componentName', ' ', data->>'action'),
            'unknown'
          ) as feature_name,
          COUNT(*) as use_count
        FROM analytics_events
        WHERE event_type = 'component_interaction'
        AND created_at ${timeframeClause}
        GROUP BY feature_name
        ORDER BY use_count DESC
        LIMIT 10
      `);

      return result.rows.map(row => ({
        feature: row.feature_name,
        count: parseInt(row.use_count)
      }));
    } catch (error) {
      console.error('Error in getMostUsedFeatures:', error);
      return [];
    }
  }

  private async getAuditStats(userId: string, timeframeClause: string) {
    try {
      const result = await this.pool.query(
        `SELECT 
          COUNT(*) as total_audits,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_audits
         FROM energy_audits
         WHERE user_id = $1 AND created_at ${timeframeClause}`,
        [userId]
      );

      return {
        totalAudits: parseInt(result.rows[0]?.total_audits || '0'),
        completedAudits: parseInt(result.rows[0]?.completed_audits || '0')
      };
    } catch (error) {
      console.error('Error in getAuditStats:', error);
      return { totalAudits: 0, completedAudits: 0 };
    }
  }

  private async getProductEngagementStats(userId: string, timeframeClause: string) {
    try {
      // Using analytics_events instead of user_actions
      const result = await this.pool.query(
        `SELECT 
          COUNT(DISTINCT CASE WHEN event_type = 'product_view' THEN id END) as product_views,
          COUNT(DISTINCT CASE WHEN event_type = 'recommendation_view' THEN id END) as recommendations_viewed,
          COUNT(DISTINCT CASE WHEN event_type = 'recommendation_action' THEN id END) as recommendations_actioned
         FROM analytics_events
         WHERE user_id = $1 AND created_at ${timeframeClause}`,
        [userId]
      );

      return {
        productViews: parseInt(result.rows[0]?.product_views || '0'),
        recommendationsViewed: parseInt(result.rows[0]?.recommendations_viewed || '0'),
        recommendationsActioned: parseInt(result.rows[0]?.recommendations_actioned || '0')
      };
    } catch (error) {
      console.error('Error in getProductEngagementStats:', error);
      return { productViews: 0, recommendationsViewed: 0, recommendationsActioned: 0 };
    }
  }

  private async getUserStats(timeframeClause: string) {
    try {
      // Fixed to use 'id' column instead of 'user_id'
      const result = await this.pool.query(
        `SELECT 
          COUNT(DISTINCT id) as active_users,
          COUNT(DISTINCT CASE 
            WHEN created_at ${timeframeClause} THEN id 
          END) as new_users
         FROM users`
      );

      return {
        activeUsers: parseInt(result.rows[0]?.active_users || '0'),
        newUsers: parseInt(result.rows[0]?.new_users || '0')
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return { activeUsers: 0, newUsers: 0 };
    }
  }

  private async getAggregateAuditStats(timeframeClause: string) {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*) as total_audits
         FROM energy_audits
         WHERE created_at ${timeframeClause}`
      );

      return {
        totalAudits: parseInt(result.rows[0]?.total_audits || '0')
      };
    } catch (error) {
      console.error('Error in getAggregateAuditStats:', error);
      return { totalAudits: 0 };
    }
  }

  private async getAggregateProductStats(timeframeClause: string) {
    try {
      // Using analytics_events instead of user_actions
      const result = await this.pool.query(
        `SELECT 
          (data->>'productId') as product_id,
          COUNT(*) as view_count
         FROM analytics_events
         WHERE event_type = 'product_view'
         AND created_at ${timeframeClause}
         GROUP BY data->>'productId'
         ORDER BY view_count DESC
         LIMIT 10`
      );

      const productEngagement: Record<string, number> = {};
      const topProducts: Array<{id: string, views: number}> = [];
      
      for (const row of result.rows) {
        if (row.product_id) {
          productEngagement[row.product_id] = parseInt(row.view_count);
          topProducts.push({
            id: row.product_id,
            views: parseInt(row.view_count)
          });
        }
      }

      return {
        productEngagement,
        topProducts
      };
    } catch (error) {
      console.error('Error in getAggregateProductStats:', error);
      return { productEngagement: {}, topProducts: [] };
    }
  }

  private getTimeframeClause(timeframe: string): string {
    switch (timeframe) {
      case 'day':
        return '>= CURRENT_DATE';
      case 'week':
        return '>= CURRENT_DATE - INTERVAL \'7 days\'';
      case 'month':
        return '>= CURRENT_DATE - INTERVAL \'30 days\'';
      case 'year':
        return '>= CURRENT_DATE - INTERVAL \'1 year\'';
      default:
        return '>= CURRENT_DATE - INTERVAL \'30 days\'';
    }
  }

  // Helper method to generate a UUID (replacement for crypto.randomUUID())
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
