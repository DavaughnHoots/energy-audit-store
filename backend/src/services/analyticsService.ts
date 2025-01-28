// backend/src/services/analyticsService.ts

import { Pool } from 'pg';

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
}

export class AnalyticsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async trackUserAction(userId: string, action: string, metadata: Record<string, any>): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_actions (user_id, action_type, metadata, created_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [userId, action, metadata]
    );
  }

  async getUserMetrics(userId: string, timeframe: string): Promise<UserMetrics> {
    const timeframeClause = this.getTimeframeClause(timeframe);
    
    const [auditStats, productStats, savingsStats] = await Promise.all([
      this.getAuditStats(userId, timeframeClause),
      this.getProductEngagementStats(userId, timeframeClause),
      this.getSavingsStats(userId, timeframeClause)
    ]);

    return {
      ...auditStats,
      ...productStats,
      ...savingsStats
    };
  }

  async getPlatformMetrics(timeframe: string): Promise<PlatformMetrics> {
    const timeframeClause = this.getTimeframeClause(timeframe);

    const [userStats, auditStats, productStats, savingsStats] = await Promise.all([
      this.getUserStats(timeframeClause),
      this.getAggregateAuditStats(timeframeClause),
      this.getAggregateProductStats(timeframeClause),
      this.getAggregateSavingsStats(timeframeClause)
    ]);

    return {
      ...userStats,
      ...auditStats,
      ...productStats,
      ...savingsStats
    };
  }

  private async getAuditStats(userId: string, timeframeClause: string) {
    const result = await this.pool.query(
      `SELECT 
        COUNT(*) as total_audits,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_audits
       FROM energy_audits
       WHERE user_id = $1 ${timeframeClause}`,
      [userId]
    );

    return {
      totalAudits: result.rows[0].total_audits,
      completedAudits: result.rows[0].completed_audits
    };
  }

  private async getProductEngagementStats(userId: string, timeframeClause: string) {
    const result = await this.pool.query(
      `SELECT 
        COUNT(DISTINCT CASE WHEN action_type = 'product_view' THEN metadata->>'productId' END) as product_views,
        COUNT(DISTINCT CASE WHEN action_type = 'recommendation_view' THEN id END) as recommendations_viewed,
        COUNT(DISTINCT CASE WHEN action_type = 'recommendation_action' THEN id END) as recommendations_actioned
       FROM user_actions
       WHERE user_id = $1 ${timeframeClause}`,
      [userId]
    );

    return {
      productViews: result.rows[0].product_views,
      recommendationsViewed: result.rows[0].recommendations_viewed,
      recommendationsActioned: result.rows[0].recommendations_actioned
    };
  }

  private async getSavingsStats(userId: string, timeframeClause: string) {
    const result = await this.pool.query(
      `SELECT 
        COALESCE(SUM(estimated_savings), 0) as estimated_savings,
        COALESCE(SUM(actual_savings), 0) as actual_savings
       FROM user_savings
       WHERE user_id = $1 ${timeframeClause}`,
      [userId]
    );

    return {
      estimatedSavings: result.rows[0].estimated_savings,
      actualSavings: result.rows[0].actual_savings
    };
  }

  private async getUserStats(timeframeClause: string) {
    const result = await this.pool.query(
      `SELECT 
        COUNT(DISTINCT user_id) as active_users,
        COUNT(DISTINCT CASE 
          WHEN created_at ${timeframeClause} THEN user_id 
        END) as new_users
       FROM users`
    );

    return {
      activeUsers: result.rows[0].active_users,
      newUsers: result.rows[0].new_users
    };
  }

  private async getAggregateAuditStats(timeframeClause: string) {
    const result = await this.pool.query(
      `SELECT COUNT(*) as total_audits
       FROM energy_audits
       WHERE created_at ${timeframeClause}`
    );

    return {
      totalAudits: result.rows[0].total_audits
    };
  }

  private async getAggregateProductStats(timeframeClause: string) {
    const result = await this.pool.query(
      `SELECT 
        metadata->>'productId' as product_id,
        COUNT(*) as view_count
       FROM user_actions
       WHERE action_type = 'product_view'
       AND created_at ${timeframeClause}
       GROUP BY metadata->>'productId'
       ORDER BY view_count DESC
       LIMIT 10`
    );

    return {
      productEngagement: result.rows.reduce((acc, row) => {
        acc[row.product_id] = row.view_count;
        return acc;
      }, {}),
      topProducts: result.rows.map(row => ({
        id: row.product_id,
        views: row.view_count
      }))
    };
  }

  private async getAggregateSavingsStats(timeframeClause: string) {
    const result = await this.pool.query(
      `SELECT AVG(actual_savings) as average_savings
       FROM user_savings
       WHERE created_at ${timeframeClause}`
    );

    return {
      averageSavings: result.rows[0].average_savings || 0
    };
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
        return '';
    }
  }

  async generateAnalyticsReport(timeframe: string = 'month'): Promise<string> {
    const metrics = await this.getPlatformMetrics(timeframe);
    
    const reportId = crypto.randomUUID();
    await this.pool.query(
      `INSERT INTO analytics_reports (
        id, timeframe, metrics, created_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [reportId, timeframe, metrics]
    );

    return reportId;
  }

  async getAnalyticsReport(reportId: string) {
    const result = await this.pool.query(
      'SELECT * FROM analytics_reports WHERE id = $1',
      [reportId]
    );

    if (result.rows.length === 0) {
      throw new Error('Report not found');
    }

    return result.rows[0];
  }
}