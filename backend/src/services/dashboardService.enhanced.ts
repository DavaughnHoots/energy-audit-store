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
  latestAuditId?: string | null;
  userId?: string;
  
  // Enhanced dashboard data
  energyAnalysis?: {
    energyBreakdown: Array<{
      name: string;
      value: number;
    }>;
    consumption: Array<{
      name: string;
      value: number;
    }>;
    savingsAnalysis: Array<{
      name: string;
      estimatedSavings: number;
      actualSavings: number;
    }>;
  };
  enhancedRecommendations?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    status: 'active' | 'implemented';
    estimatedSavings: number;
    actualSavings: number | null;
    implementationDate: string | null;
    implementationCost: number | null;
    estimatedCost: number;
    paybackPeriod: number;
    lastUpdate: string;
  }>;
  productPreferences?: {
    categories: string[];
    budgetConstraint?: number;
  };
  
  // Data source information
  dataSummary?: {
    hasDetailedData: boolean;
    isUsingDefaultData: boolean;
    dataSource: 'detailed' | 'generated' | 'empty';
  };
}

interface SavingsUpdate {
  actualSavings: number;
  implementationCost?: number;
  notes?: string;
}

class EnhancedDashboardService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly REFRESH_INTERVAL = 60000; // 1 minute
  
  /**
   * Generates default energy analysis data for users who have audits
   * but are missing detailed visualization data
   */
  private generateDefaultEnergyAnalysis(): {
    energyBreakdown: Array<{ name: string; value: number }>;
    consumption: Array<{ name: string; value: number }>;
    savingsAnalysis: Array<{ name: string; estimatedSavings: number; actualSavings: number }>;
  } {
    // Sample data based on common energy usage patterns
    return {
      energyBreakdown: [
        { name: 'HVAC', value: 42 },
        { name: 'Lighting', value: 18 },
        { name: 'Appliances', value: 15 },
        { name: 'Electronics', value: 14 },
        { name: 'Other', value: 11 }
      ],
      consumption: [
        { name: 'Living Room', value: 28 },
        { name: 'Kitchen', value: 24 },
        { name: 'Bedrooms', value: 18 },
        { name: 'Bathroom', value: 10 },
        { name: 'Outdoor', value: 20 }
      ],
      savingsAnalysis: [
        { name: 'HVAC Improvements', estimatedSavings: 350, actualSavings: 320 },
        { name: 'Lighting Efficiency', estimatedSavings: 180, actualSavings: 165 },
        { name: 'Appliance Upgrades', estimatedSavings: 220, actualSavings: 190 },
        { name: 'Insulation', estimatedSavings: 150, actualSavings: 130 }
      ]
    };
  }
  
  /**
   * Generates sample recommendations when a user has recommendations count
   * but is missing detailed recommendation data
   * 
   * Includes default recommendations for all 8 product categories:
   * - HVAC Systems
   * - Lighting
   * - Insulation
   * - Windows & Doors
   * - Energy-Efficient Appliances
   * - Water Heating
   * - Smart Home Devices
   * - Renewable Energy
   */
  private generateDefaultRecommendations(): Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    priority: 'high' | 'medium' | 'low';
    status: 'active' | 'implemented';
    estimatedSavings: number;
    actualSavings: number | null;
    implementationDate: string | null;
    implementationCost: number | null;
    estimatedCost: number;
    paybackPeriod: number;
    lastUpdate: string;
  }> {
    // Current timestamp for lastUpdate field
    const currentTimestamp = new Date().toISOString();
    
    // Comprehensive recommendation data covering all product categories
    return [
      // HVAC Systems - 2 recommendations
      {
        id: 'default-rec-hvac-1',
        title: 'HVAC System Upgrade',
        description: 'Replace aging HVAC system with an energy-efficient model to reduce energy consumption by up to 20%.',
        type: 'hvac',
        priority: 'high',
        status: 'active',
        estimatedSavings: 520,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 3850,
        paybackPeriod: 7.4,
        lastUpdate: currentTimestamp
      },
      {
        id: 'default-rec-hvac-2',
        title: 'Smart Thermostat Installation',
        description: 'Install a programmable smart thermostat to optimize your heating and cooling schedule based on your lifestyle patterns.',
        type: 'hvac',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 120,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 250,
        paybackPeriod: 2.1,
        lastUpdate: currentTimestamp
      },
      
      // Lighting - 1 recommendation
      {
        id: 'default-rec-lighting',
        title: 'Energy-Efficient LED Lighting',
        description: 'Replace standard bulbs with LED lighting throughout your property to reduce lighting energy use by up to 75%.',
        type: 'lighting',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 180,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 450,
        paybackPeriod: 2.5,
        lastUpdate: currentTimestamp
      },
      
      // Insulation - 1 recommendation
      {
        id: 'default-rec-insulation',
        title: 'Attic Insulation Upgrade',
        description: 'Add additional insulation to your attic to prevent heat loss during winter and keep cool air in during summer.',
        type: 'insulation',
        priority: 'high',
        status: 'active',
        estimatedSavings: 250,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 1200,
        paybackPeriod: 4.8,
        lastUpdate: currentTimestamp
      },
      
      // Windows & Doors - 1 recommendation
      {
        id: 'default-rec-windows',
        title: 'Energy-Efficient Windows',
        description: 'Replace old windows with energy-efficient models to reduce drafts and heat transfer through your windows.',
        type: 'windows',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 180,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 3500,
        paybackPeriod: 19.4,
        lastUpdate: currentTimestamp
      },
      
      // Energy-Efficient Appliances - 1 recommendation
      {
        id: 'default-rec-appliances',
        title: 'Energy Star Appliance Upgrade',
        description: 'Replace older appliances with Energy Star certified models to reduce electricity consumption throughout your home.',
        type: 'appliances',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 120,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 1200,
        paybackPeriod: 10.0,
        lastUpdate: currentTimestamp
      },
      
      // Water Heating - 1 recommendation
      {
        id: 'default-rec-water-heating',
        title: 'Tankless Water Heater Installation',
        description: 'Replace your conventional water heater with an energy-efficient tankless model that heats water on demand.',
        type: 'water_heating',
        priority: 'medium',
        status: 'active',
        estimatedSavings: 110,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 1800,
        paybackPeriod: 16.4,
        lastUpdate: currentTimestamp
      },
      
      // Smart Home Devices - 1 recommendation
      {
        id: 'default-rec-smart-home',
        title: 'Smart Home Energy Management System',
        description: 'Install a comprehensive smart home system to automate and optimize energy usage throughout your home.',
        type: 'smart_home',
        priority: 'low',
        status: 'active',
        estimatedSavings: 150,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 600,
        paybackPeriod: 4.0,
        lastUpdate: currentTimestamp
      },
      
      // Renewable Energy - 1 recommendation
      {
        id: 'default-rec-renewable',
        title: 'Solar Panel Installation',
        description: 'Install solar panels to generate clean, renewable electricity and significantly reduce your utility bills.',
        type: 'renewable',
        priority: 'high',
        status: 'active',
        estimatedSavings: 850,
        actualSavings: null,
        implementationDate: null,
        implementationCost: null,
        estimatedCost: 12000,
        paybackPeriod: 14.1,
        lastUpdate: currentTimestamp
      }
    ];
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await cache.del(`dashboard_stats:${userId}`);
    await cache.del(`dashboard_stats_enhanced:${userId}`);
  }

  async getUserStats(userId: string, newAuditId?: string): Promise<DashboardStats> {
    const cacheKey = `dashboard_stats_enhanced:${userId}`;
    
    // Skip cache if newAuditId is provided
    const cachedStats = newAuditId ? null : await cache.get<DashboardStats>(cacheKey);
    
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
      const auditId = newAuditId || latestAuditQuery.rows[0]?.id;
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
          enhancedRecommendations = enhancedRecsQuery.rows.map((row: any) => ({
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

      // Determine if we should use generated data based on stats
      const hasStats = statsQuery.rows[0]?.completed_audits > 0;
      const hasEnergyData = energyAnalysisData !== null &&
        ((energyAnalysisData.energyBreakdown && energyAnalysisData.energyBreakdown.length > 0) ||
         (energyAnalysisData.consumption && energyAnalysisData.consumption.length > 0) ||
         (energyAnalysisData.savingsAnalysis && energyAnalysisData.savingsAnalysis.length > 0));
      const hasRecommendationsData = enhancedRecommendations && enhancedRecommendations.length > 0;
      
      // Flag to indicate if we're using default data
      const isUsingDefaultData = hasStats && (!hasEnergyData || !hasRecommendationsData);
      
      // Enhanced debug logging for recommendations status
      appLogger.debug('Dashboard recommendations status:', { 
        userId,
        auditId: newAuditId || latestAuditQuery.rows[0]?.id || null,
        hasStats,
        hasRecommendationsData,
        hasEnergyData,
        isUsingDefaultData,
        recommendationsCount: enhancedRecommendations?.length || 0,
        wouldUseDefaultRecommendations: hasStats && !hasRecommendationsData,
        generatedRecsLength: this.generateDefaultRecommendations().length
      });
      
      // Always generate default recommendations for testing
      const defaultRecommendations = this.generateDefaultRecommendations();
      
      // Create the full enhanced dashboard stats object
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
        // Use newAuditId if provided, otherwise use the latest audit ID from the database
        latestAuditId: newAuditId || latestAuditQuery.rows[0]?.id || null,
        lastUpdated: statsQuery.rows[0]?.last_updated || new Date().toISOString(),
        refreshInterval: this.REFRESH_INTERVAL,
        userId: userId,
        
        // Enhanced data - Always provide arrays, use generated data when stats exist but detailed data doesn't
        energyAnalysis: (hasEnergyData && energyAnalysisData) ? energyAnalysisData : 
                        hasStats ? this.generateDefaultEnergyAnalysis() : 
                        { energyBreakdown: [], consumption: [], savingsAnalysis: [] },
                         
        // CRITICAL FIX: ENSURE DASHBOARD ALWAYS HAS RECOMMENDATIONS
        // Always include recommendations - prioritize real data, fall back to defaults, never return empty array
        enhancedRecommendations: hasRecommendationsData ? enhancedRecommendations :
                                 defaultRecommendations, // Always use defaults instead of empty array
                                  
        productPreferences: productPreferences || { categories: [] },
        
        // Add data source metadata
        dataSummary: {
          hasDetailedData: hasEnergyData && hasRecommendationsData,
          isUsingDefaultData: isUsingDefaultData || !hasRecommendationsData, // Update flag if using default recommendations
          dataSource: hasEnergyData && hasRecommendationsData ? 'detailed' : 'generated'
        }
      };
      
      // Final validation and debug log to ensure recommendations are included
      appLogger.debug('Final dashboard stats object:', {
        userId,
        auditId: stats.latestAuditId,
        hasRecommendations: (stats.enhancedRecommendations && stats.enhancedRecommendations.length > 0),
        recommendationsCount: stats.enhancedRecommendations?.length || 0,
        dataSource: stats.dataSummary?.dataSource || 'unknown'
      });

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
    userId: string,
    categories: string[],
    budgetConstraint?: number
  ): Promise<void> {
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
