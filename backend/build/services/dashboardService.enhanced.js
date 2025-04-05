import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { appLogger } from '../config/logger.js';

class EnhancedDashboardService {
  constructor() {
    this.CACHE_TTL = 300; // 5 minutes
    this.REFRESH_INTERVAL = 60000; // 1 minute
  }

  async invalidateUserCache(userId) {
    await cache.del(`dashboard_stats:${userId}`);
    await cache.del(`dashboard_stats_enhanced:${userId}`);
  }

  async getUserStats(userId, newAuditId) {
    const cacheKey = `dashboard_stats_enhanced:${userId}`;
    
    // Skip cache if newAuditId is provided
    const cachedStats = newAuditId ? null : await cache.get(cacheKey);
    
    if (cachedStats && !newAuditId) {
      return cachedStats;
    }

    try {
      // First get all the data from the original dashboard service
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
      
      // Get the latest audit ID for the user
      const latestAuditQuery = await pool.query(`
        SELECT id
        FROM energy_audits
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId]);
      
      // Now get the enhanced data

      // 1. Get energy analysis data from the report_data table for the latest audit
      const auditId = newAuditId || (latestAuditQuery.rows[0]?.id);
      let energyAnalysisData = null;
      
      if (auditId) {
        const reportDataQuery = await pool.query(`
          SELECT 
            rd.charts->>'energyBreakdown' as energy_breakdown,
            rd.charts->>'consumption' as consumption,
            rd.charts->>'savingsAnalysis' as savings_analysis
          FROM report_data rd
          WHERE rd.audit_id = $1
        `, [auditId]);
        
        if (reportDataQuery.rows.length > 0) {
          energyAnalysisData = {
            energyBreakdown: JSON.parse(reportDataQuery.rows[0].energy_breakdown || '[]'),
            consumption: JSON.parse(reportDataQuery.rows[0].consumption || '[]'),
            savingsAnalysis: JSON.parse(reportDataQuery.rows[0].savings_analysis || '[]')
          };
        }
      }

      // 2. Get enhanced recommendations with additional fields from report_data
      let enhancedRecommendations = null;
      
      if (auditId) {
        const enhancedRecsQuery = await pool.query(`
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
            ar.updated_at as last_update,
            rt.name as type,
            COALESCE(rd.estimated_cost, ar.estimated_cost, 0) as estimated_cost,
            CASE 
              WHEN ar.estimated_savings > 0 THEN
                COALESCE(rd.estimated_cost, ar.estimated_cost, 0) / ar.estimated_savings
              ELSE NULL
            END as payback_period
          FROM audit_recommendations ar
          JOIN energy_audits ea ON ar.audit_id = ea.id
          LEFT JOIN recommendation_types rt ON ar.type_id = rt.id
          LEFT JOIN report_data rd ON rd.audit_id = ea.id AND rd.recommendation_id = ar.id
          WHERE ea.id = $1
          ORDER BY 
            CASE ar.priority
              WHEN 'high' THEN 1
              WHEN 'medium' THEN 2
              WHEN 'low' THEN 3
            END,
            ar.updated_at DESC
        `, [auditId]);
        
        if (enhancedRecsQuery.rows.length > 0) {
          enhancedRecommendations = enhancedRecsQuery.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            type: row.type || 'general',
            priority: row.priority,
            status: row.status,
            estimatedSavings: parseFloat(row.estimated_savings),
            actualSavings: row.actual_savings ? parseFloat(row.actual_savings) : null,
            implementationDate: row.implementation_date,
            implementationCost: row.implementation_cost ? parseFloat(row.implementation_cost) : null,
            estimatedCost: parseFloat(row.estimated_cost || 0),
            paybackPeriod: row.payback_period ? parseFloat(row.payback_period) : null,
            lastUpdate: row.last_update
          }));
        }
      }

      // 3. Get user product preferences
      const preferencesQuery = await pool.query(`
        SELECT 
          up.preferred_categories,
          up.budget_constraint
        FROM user_preferences up
        WHERE up.user_id = $1
      `, [userId]);
      
      let productPreferences = null;
      
      if (preferencesQuery.rows.length > 0) {
        productPreferences = {
          categories: preferencesQuery.rows[0].preferred_categories || [],
          budgetConstraint: preferencesQuery.rows[0].budget_constraint || undefined
        };
      }

      // Create the full enhanced dashboard stats object
      const stats = {
        totalSavings: {
          estimated: statsQuery.rows[0]?.total_estimated_savings || 0,
          actual: statsQuery.rows[0]?.total_actual_savings || 0,
          accuracy: statsQuery.rows[0]?.overall_accuracy || 0
        },
        completedAudits: statsQuery.rows[0]?.completed_audits || 0,
        activeRecommendations: statsQuery.rows[0]?.active_recommendations || 0,
        implementedChanges: statsQuery.rows[0]?.implemented_changes || 0,
        monthlySavings: monthlySavingsQuery.rows.map((row) => ({
          month: row.month,
          estimated: parseFloat(row.estimated),
          actual: parseFloat(row.actual)
        })),
        recommendations: recommendationsQuery.rows.map((row) => ({
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
        // Use newAuditId if provided, otherwise use the latest audit ID from the database
        latestAuditId: newAuditId || (latestAuditQuery.rows[0]?.id || null),
        lastUpdated: statsQuery.rows[0]?.last_updated || new Date().toISOString(),
        refreshInterval: this.REFRESH_INTERVAL,
        userId: userId,
        
        // Enhanced data - convert null to undefined to satisfy TypeScript
        energyAnalysis: energyAnalysisData || undefined,
        enhancedRecommendations: enhancedRecommendations || undefined,
        productPreferences: productPreferences || undefined
      };

      await cache.set(cacheKey, JSON.stringify(stats), this.CACHE_TTL);
      return stats;
    } catch (error) {
      appLogger.error('Error fetching enhanced dashboard stats:', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        context: 'EnhancedDashboardService.getUserStats'
      });
      throw error;
    }
  }

  async updateRecommendationStatus(
    userId,
    recommendationId,
    status,
    implementationDate
  ) {
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

      await this.invalidateUserCache(userId);
    } catch (error) {
      appLogger.error('Error updating recommendation status:', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        recommendationId,
        status,
        context: 'EnhancedDashboardService.updateRecommendationStatus'
      });
      throw error;
    }
  }

  async updateActualSavings(
    userId,
    recommendationId,
    month,
    update
  ) {
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
      await this.invalidateUserCache(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error updating actual savings:', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        recommendationId,
        month: month.toISOString(),
        context: 'EnhancedDashboardService.updateActualSavings'
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateUserPreferences(
    userId,
    categories,
    budgetConstraint
  ) {
    try {
      await pool.query(`
        INSERT INTO user_preferences (
          user_id,
          preferred_categories,
          budget_constraint,
          updated_at
        )
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          preferred_categories = $2,
          budget_constraint = $3,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, categories, budgetConstraint]);

      await this.invalidateUserCache(userId);
    } catch (error) {
      appLogger.error('Error updating user preferences:', { 
        error: error instanceof Error ? error.message : String(error),
        userId,
        categories,
        budgetConstraint,
        context: 'EnhancedDashboardService.updateUserPreferences'
      });
      throw error;
    }
  }
}

export const enhancedDashboardService = new EnhancedDashboardService();
