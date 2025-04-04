// backend/src/services/AnalyticsService.enhanced.ts
// Fixed version to match actual database schema

import pkg from 'pg';
const { Pool } = pkg;



>;
}

export class AnalyticsService {
  private pool; // Using any to bypass TypeScript errors with pg pool

  constructor(pool) {
    this.pool = pool;
  }

  /**
   * Create or update an analytics session
   */
  async createOrUpdateSession(sessionId, userId?) {
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
  async trackEvent(sessionId, eventType, area, data) {
    try {
      // Ensure the session exists/is updated
      await this.createOrUpdateSession(sessionId);
      
      // Get the user_id from the session
      const session = await this.pool.query(
        'SELECT user_id FROM analytics_sessions WHERE id = $1',
        [sessionId]
      );
      
      const userId = session.rows.length > 0 ? session.rows[0].user_id ;
      
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

  async getUserMetrics(userId, timeframe) {
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
        estimatedSavings,
        actualSavings
      };
    } catch (error) {
      console.error('Error in getUserMetrics:', error);
      // Return default metrics if there's an error
      return {
        totalAudits,
        completedAudits,
        productViews,
        recommendationsViewed,
        recommendationsActioned,
        estimatedSavings,
        actualSavings
      };
    }
  }

  async getPlatformMetrics(timeframe) {
    const timeframeClause = this.getTimeframeClause(timeframe);

    try {
      const [userStats, auditStats, productStats] = await Promise.all([
        this.getUserStats(timeframeClause),
        this.getAggregateAuditStats(timeframeClause),
        this.getAggregateProductStats(timeframeClause)
      ]);

      return {
        ...userStats,
        ...auditStats,
        ...productStats,
        // Default value for averageSavings since we don't have user_savings table
        averageSavings
      };
    } catch (error) {
      console.error('Error in getPlatformMetrics:', error);
      // Return default metrics if there's an error
      return {
        activeUsers,
        newUsers,
        totalAudits,
        productEngagement: {},
        averageSavings,
        topProducts: []
      };
    }
  }

  private async getAuditStats(userId, timeframeClause) {
    try {
      const result = await this.pool.query(
        `SELECT 
          COUNT(*),
          COUNT(CASE WHEN status = 'completed' THEN 1 END)
         FROM energy_audits
         WHERE user_id = $1 AND created_at ${timeframeClause}`,
        [userId]
      );

      return {
        totalAudits(result.rows[0]?.total_audits || '0'),
        completedAudits(result.rows[0]?.completed_audits || '0')
      };
    } catch (error) {
      console.error('Error in getAuditStats:', error);
      return { totalAudits, completedAudits };
    }
  }

  private async getProductEngagementStats(userId, timeframeClause) {
    try {
      // Using analytics_events instead of user_actions
      const result = await this.pool.query(
        `SELECT 
          COUNT(DISTINCT CASE WHEN event_type = 'product_view' THEN id END),
          COUNT(DISTINCT CASE WHEN event_type = 'recommendation_view' THEN id END),
          COUNT(DISTINCT CASE WHEN event_type = 'recommendation_action' THEN id END)
         FROM analytics_events
         WHERE user_id = $1 AND created_at ${timeframeClause}`,
        [userId]
      );

      return {
        productViews(result.rows[0]?.product_views || '0'),
        recommendationsViewed(result.rows[0]?.recommendations_viewed || '0'),
        recommendationsActioned(result.rows[0]?.recommendations_actioned || '0')
      };
    } catch (error) {
      console.error('Error in getProductEngagementStats:', error);
      return { productViews, recommendationsViewed, recommendationsActioned };
    }
  }

  private async getUserStats(timeframeClause) {
    try {
      // Fixed to use 'id' column instead of 'user_id'
      const result = await this.pool.query(
        `SELECT 
          COUNT(DISTINCT id),
          COUNT(DISTINCT CASE 
            WHEN created_at ${timeframeClause} THEN id 
          END)
         FROM users`
      );

      return {
        activeUsers(result.rows[0]?.active_users || '0'),
        newUsers(result.rows[0]?.new_users || '0')
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return { activeUsers, newUsers };
    }
  }

  private async getAggregateAuditStats(timeframeClause) {
    try {
      const result = await this.pool.query(
        `SELECT COUNT(*)
         FROM energy_audits
         WHERE created_at ${timeframeClause}`
      );

      return {
        totalAudits(result.rows[0]?.total_audits || '0')
      };
    } catch (error) {
      console.error('Error in getAggregateAuditStats:', error);
      return { totalAudits };
    }
  }

  private async getAggregateProductStats(timeframeClause) {
    try {
      // Using analytics_events instead of user_actions
      const result = await this.pool.query(
        `SELECT 
          (data->>'productId'),
          COUNT(*)
         FROM analytics_events
         WHERE event_type = 'product_view'
         AND created_at ${timeframeClause}
         GROUP BY data->>'productId'
         ORDER BY view_count DESC
         LIMIT 10`
      );

      const productEngagement = {};
      const topProducts<{id, views}> = [];
      
      for (const row of result.rows) {
        if (row.product_id) {
          productEngagement[row.product_id] = parseInt(row.view_count);
          topProducts.push({
            id.product_id,
            views(row.view_count)
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

  private getTimeframeClause(timeframe) {
    switch (timeframe) {
      case 'day' '>= CURRENT_DATE';
      case 'week' '>= CURRENT_DATE - INTERVAL \'7 days\'';
      case 'month' '>= CURRENT_DATE - INTERVAL \'30 days\'';
      case 'year' '>= CURRENT_DATE - INTERVAL \'1 year\'';
      default '>= CURRENT_DATE - INTERVAL \'30 days\'';
    }
  }

  // Helper method to generate a UUID (replacement for crypto.randomUUID())
  private generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
        v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
