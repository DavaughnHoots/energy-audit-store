import { pool } from '../config/database';
import { appLogger } from '../config/logger';

interface DashboardStats {
  totalSavings: number;
  completedAudits: number;
  activeRecommendations: number;
  implementedChanges: number;
  monthlySavings: {
    month: string;
    savings: number;
  }[];
  lastUpdated: string;
  refreshInterval: number;
}

export class DashboardService {
  async getUserStats(userId: string): Promise<DashboardStats> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      appLogger.info('Fetching dashboard stats for user:', { userId });

      // Validate UUID format
      const validUuid = await client.query(
        'SELECT $1::uuid AS uuid',
        [userId]
      ).catch(() => {
        throw new Error('Invalid user ID format');
      });

      // Get all stats in a single query for better performance
      const statsResult = await client.query(`
        WITH completed_audits AS (
          SELECT COUNT(*) as count
          FROM energy_audits
          WHERE user_id = $1::uuid AND status = 'completed'
        ),
        recommendations_stats AS (
          SELECT
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            COUNT(*) FILTER (WHERE status = 'implemented') as implemented_count,
            COALESCE(SUM(estimated_savings) FILTER (WHERE status = 'implemented'), 0) as total_savings
          FROM recommendations
          WHERE user_id = $1::uuid
        ),
        monthly_savings AS (
          SELECT
            TO_CHAR(date_trunc('month', implemented_date), 'Mon') as month,
            COALESCE(SUM(estimated_savings), 0) as savings
          FROM recommendations
          WHERE user_id = $1::uuid
            AND status = 'implemented'
            AND implemented_date >= NOW() - INTERVAL '6 months'
          GROUP BY date_trunc('month', implemented_date)
          ORDER BY date_trunc('month', implemented_date) DESC
          LIMIT 6
        )
        SELECT
          completed_audits.count as completed_audits,
          recommendations_stats.active_count as active_recommendations,
          recommendations_stats.implemented_count as implemented_changes,
          recommendations_stats.total_savings,
          COALESCE(json_agg(
            json_build_object(
              'month', monthly_savings.month,
              'savings', monthly_savings.savings
            ) ORDER BY date_trunc('month', implemented_date) DESC
          ) FILTER (WHERE monthly_savings.month IS NOT NULL), '[]') as monthly_savings
        FROM completed_audits
        CROSS JOIN recommendations_stats
        LEFT JOIN monthly_savings ON true
        GROUP BY
          completed_audits.count,
          recommendations_stats.active_count,
          recommendations_stats.implemented_count,
          recommendations_stats.total_savings
      `, [userId]);

      await client.query('COMMIT');

      const row = statsResult.rows[0];
      const stats: DashboardStats = {
        totalSavings: parseFloat(row.total_savings),
        completedAudits: parseInt(row.completed_audits),
        activeRecommendations: parseInt(row.active_recommendations),
        implementedChanges: parseInt(row.implemented_changes),
        monthlySavings: row.monthly_savings.map((ms: any) => ({
          month: ms.month,
          savings: parseFloat(ms.savings)
        })),
        lastUpdated: new Date().toISOString(),
        refreshInterval: 300000 // 5 minutes
      };

      appLogger.info('Successfully fetched dashboard stats', { userId });
      return stats;

    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error fetching dashboard stats:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw new Error('Failed to fetch dashboard statistics');
    } finally {
      client.release();
    }
  }
}

export const dashboardService = new DashboardService();
