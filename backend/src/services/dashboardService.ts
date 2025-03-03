import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { appLogger } from '../config/logger.js';

interface DashboardStats {
  totalSavings: {
    estimated: number;
    actual: number;
    accuracy: number;
  };
  completedAudits: number;
  activeRecommendations: number;
  implementedChanges: number;
  monthlySavings: Array<{
    month: string;
    estimated: number;
    actual: number;
  }>;
  recommendations?: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    status: 'active' | 'implemented';
    estimatedSavings: number;
    actualSavings: number | null;
    implementationDate: string | null;
    implementationCost: number | null;
    lastUpdate: string;
  }>;
  lastUpdated?: string;
  refreshInterval?: number;
}

interface SavingsUpdate {
  actualSavings: number;
  implementationCost?: number;
  notes?: string;
}

class DashboardService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly REFRESH_INTERVAL = 60000; // 1 minute

  async invalidateUserCache(userId: string): Promise<void> {
    await cache.del(`dashboard_stats:${userId}`);
  }

  async getUserStats(userId: string): Promise<DashboardStats> {
    const cacheKey = `dashboard_stats:${userId}`;
    const cachedStats = await cache.get<DashboardStats>(cacheKey);
    
    if (cachedStats) {
      return cachedStats;
    }

    try {
      const statsQuery = await pool.query(`
        WITH user_stats AS (
          SELECT 
            ea.user_id,
            COALESCE(SUM(ar.estimated_savings), 0) as total_estimated_savings,
            COALESCE(SUM(ar.actual_savings), 0) as total_actual_savings,
            CASE 
              WHEN COALESCE(SUM(ar.estimated_savings), 0) = 0 THEN 0
              ELSE (COALESCE(SUM(ar.actual_savings), 0) / COALESCE(SUM(ar.estimated_savings), 0) * 100)
            END as overall_accuracy,
            COUNT(DISTINCT ea.id) as completed_audits,
            COUNT(DISTINCT CASE WHEN ar.status = 'active' THEN ar.id END) as active_recommendations,
            COUNT(DISTINCT CASE WHEN ar.status = 'implemented' THEN ar.id END) as implemented_changes
          FROM energy_audits ea
          LEFT JOIN audit_recommendations ar ON ea.id = ar.audit_id
          WHERE ea.user_id = $1
          GROUP BY ea.user_id
        )
        INSERT INTO dashboard_stats (
          user_id,
          total_estimated_savings,
          total_actual_savings,
          overall_accuracy,
          completed_audits,
          active_recommendations,
          implemented_changes,
          last_updated
        )
        SELECT 
          $1,
          total_estimated_savings,
          total_actual_savings,
          overall_accuracy,
          completed_audits,
          active_recommendations,
          implemented_changes,
          CURRENT_TIMESTAMP
        FROM user_stats
        ON CONFLICT (user_id) 
        DO UPDATE SET
          total_estimated_savings = EXCLUDED.total_estimated_savings,
          total_actual_savings = EXCLUDED.total_actual_savings,
          overall_accuracy = EXCLUDED.overall_accuracy,
          completed_audits = EXCLUDED.completed_audits,
          active_recommendations = EXCLUDED.active_recommendations,
          implemented_changes = EXCLUDED.implemented_changes,
          last_updated = CURRENT_TIMESTAMP
        RETURNING *;
      `, [userId]);

      const monthlySavingsQuery = await pool.query(`
        SELECT 
          to_char(month, 'YYYY-MM') as month,
          SUM(estimated_savings) as estimated,
          SUM(actual_savings) as actual
        FROM monthly_savings
        WHERE user_id = $1
        GROUP BY month
        ORDER BY month DESC
        LIMIT 12
      `, [userId]);

      const recommendationsQuery = await pool.query(`
        SELECT 
          ar.id,
          ar.title,
          ar.description,
          ar.priority,
          ar.status,
          ar.estimated_savings,
          ar.actual_savings,
          ar.implementation_date,
          ar.implementation_cost,
          ar.updated_at as last_update
        FROM audit_recommendations ar
        JOIN energy_audits ea ON ar.audit_id = ea.id
        WHERE ea.user_id = $1
        ORDER BY 
          CASE ar.priority
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END,
          ar.updated_at DESC
      `, [userId]);

      const stats: DashboardStats = {
        totalSavings: {
          estimated: statsQuery.rows[0]?.total_estimated_savings || 0,
          actual: statsQuery.rows[0]?.total_actual_savings || 0,
          accuracy: statsQuery.rows[0]?.overall_accuracy || 0
        },
        completedAudits: statsQuery.rows[0]?.completed_audits || 0,
        activeRecommendations: statsQuery.rows[0]?.active_recommendations || 0,
        implementedChanges: statsQuery.rows[0]?.implemented_changes || 0,
        monthlySavings: monthlySavingsQuery.rows.map((row: { month: string; estimated: string; actual: string; }) => ({
          month: row.month,
          estimated: parseFloat(row.estimated),
          actual: parseFloat(row.actual)
        })),
        recommendations: recommendationsQuery.rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          priority: row.priority,
          status: row.status,
          estimatedSavings: parseFloat(row.estimated_savings),
          actualSavings: row.actual_savings ? parseFloat(row.actual_savings) : null,
          implementationDate: row.implementation_date,
          implementationCost: row.implementation_cost ? parseFloat(row.implementation_cost) : null,
          lastUpdate: row.last_update
        })),
        lastUpdated: statsQuery.rows[0]?.last_updated || new Date().toISOString(),
        refreshInterval: this.REFRESH_INTERVAL
      };

      await cache.set(cacheKey, JSON.stringify(stats), this.CACHE_TTL);
      return stats;
    } catch (error) {
      appLogger.error('Error fetching dashboard stats:', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        context: 'DashboardService.getUserStats'
      });
      throw error;
    }
  }

  async updateRecommendationStatus(
    userId: string,
    recommendationId: string,
    status: 'active' | 'implemented',
    implementationDate?: Date
  ): Promise<void> {
    try {
      await pool.query(`
        UPDATE audit_recommendations ar
        SET 
          status = $1,
          implementation_date = $2,
          updated_at = CURRENT_TIMESTAMP
        FROM energy_audits ea
        WHERE ar.id = $3
          AND ar.audit_id = ea.id
          AND ea.user_id = $4
      `, [status, implementationDate, recommendationId, userId]);

      await cache.del(`dashboard_stats:${userId}`);
    } catch (error) {
      appLogger.error('Error updating recommendation status:', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        recommendationId,
        status,
        context: 'DashboardService.updateRecommendationStatus'
      });
      throw error;
    }
  }

  async updateActualSavings(
    userId: string,
    recommendationId: string,
    month: Date,
    update: SavingsUpdate
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update monthly savings
      await client.query(`
        INSERT INTO monthly_savings (
          user_id,
          recommendation_id,
          month,
          actual_savings,
          estimated_savings,
          implementation_cost,
          notes
        )
        SELECT 
          $1,
          $2,
          $3,
          $4,
          estimated_savings,
          $5,
          $6
        FROM audit_recommendations
        WHERE id = $2
        ON CONFLICT (user_id, recommendation_id, month)
        DO UPDATE SET
          actual_savings = EXCLUDED.actual_savings,
          implementation_cost = EXCLUDED.implementation_cost,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
      `, [
        userId,
        recommendationId,
        month,
        update.actualSavings,
        update.implementationCost,
        update.notes
      ]);

      // Update recommendation totals
      await client.query(`
        UPDATE audit_recommendations ar
        SET 
          actual_savings = (
            SELECT SUM(actual_savings)
            FROM monthly_savings
            WHERE recommendation_id = ar.id
          ),
          implementation_cost = $1,
          last_savings_update = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [update.implementationCost, recommendationId]);

      await client.query('COMMIT');
      await cache.del(`dashboard_stats:${userId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error updating actual savings:', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        recommendationId,
        month: month.toISOString(),
        context: 'DashboardService.updateActualSavings'
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const dashboardService = new DashboardService();
