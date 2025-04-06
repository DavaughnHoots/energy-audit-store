import { pool } from '../config/database.js';
import { appLogger } from '../config/logger.js';

/**
 * Helper functions for aggregating data across multiple audits
 * These functions collect unique recommendations and energy data
 * to populate the dashboard effectively
 */

interface AuditRecommendation {
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
  auditId: string;
  createdAt: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
}

interface SavingsChartDataPoint {
  name: string;
  estimatedSavings: number;
  actualSavings: number;
}

/**
 * Fetches unique recommendations from all of a user's audits, grouped by type
 * Returns one recommendation per type, selecting the most recent for each type
 */
export async function getUniqueRecommendationsByType(userId: string): Promise<AuditRecommendation[]> {
  try {
    appLogger.debug('Fetching unique recommendations by type', { userId });
    
    // Query all recommendations across all audits for this user
    const recommendationsQuery = await pool.query(`
      SELECT 
        ar.id,
        ar.title,
        ar.description,
        ar.priority,
        ar.status,
        ar.estimated_savings as estimated_savings,
        ar.actual_savings as actual_savings,
        ar.implementation_date,
        ar.implementation_cost,
        ar.created_at,
        ar.updated_at as last_update,
        rt.name as type,
        ea.id as audit_id,
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
      WHERE ea.user_id = $1
      ORDER BY 
        rt.name,
        ar.created_at DESC
    `, [userId]);
    
    if (recommendationsQuery.rows.length === 0) {
      appLogger.debug('No recommendations found for user', { userId });
      return [];
    }
    
    // Group recommendations by type
    const recommendationsByType: Record<string, AuditRecommendation[]> = {};
    
    for (const row of recommendationsQuery.rows) {
      const type = row.type || 'general';
      
      if (!recommendationsByType[type]) {
        recommendationsByType[type] = [];
      }
      
      recommendationsByType[type].push({
        id: row.id,
        title: row.title,
        description: row.description,
        type: type,
        priority: row.priority,
        status: row.status,
        estimatedSavings: parseFloat(row.estimated_savings),
        actualSavings: row.actual_savings ? parseFloat(row.actual_savings) : null,
        implementationDate: row.implementation_date,
        implementationCost: row.implementation_cost ? parseFloat(row.implementation_cost) : null,
        estimatedCost: parseFloat(row.estimated_cost || 0),
        paybackPeriod: row.payback_period ? parseFloat(row.payback_period) : 0,
        lastUpdate: row.last_update,
        auditId: row.audit_id,
        createdAt: row.created_at
      });
    }
    
    // Select the most recent recommendation for each type
    const uniqueRecommendations: AuditRecommendation[] = [];
    
    for (const type in recommendationsByType) {
      // The recommendations are already sorted by created_at DESC, so the first one is the most recent
      const mostRecent = recommendationsByType[type][0];
      uniqueRecommendations.push(mostRecent);
    }
    
    // Sort by priority (high → medium → low) and then by estimated savings (highest first)
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    
    uniqueRecommendations.sort((a, b) => {
      // First sort by priority
      const priorityDiff = (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
      
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      
      // If same priority, sort by estimated savings (highest first)
      return b.estimatedSavings - a.estimatedSavings;
    });
    
    appLogger.debug('Fetched unique recommendations by type', { 
      userId, 
      uniqueCount: uniqueRecommendations.length,
      typeCount: Object.keys(recommendationsByType).length 
    });
    
    return uniqueRecommendations;
    
  } catch (error) {
    appLogger.error('Error fetching unique recommendations by type', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    throw error;
  }
}

/**
 * Aggregates energy data from all of a user's audits
 * Returns energy breakdown and consumption data from the most recent audit
 * and aggregated savings analysis data across all audits
 */
export async function getAggregatedEnergyData(userId: string): Promise<{
  energyBreakdown: ChartDataPoint[];
  consumption: ChartDataPoint[];
  savingsAnalysis: SavingsChartDataPoint[];
}> {
  try {
    appLogger.debug('Fetching aggregated energy data', { userId });
    
    // Find the most recent audit for the user
    const latestAuditQuery = await pool.query(`
      SELECT id
      FROM energy_audits
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);
    
    if (latestAuditQuery.rows.length === 0) {
      appLogger.debug('No audits found for user', { userId });
      return {
        energyBreakdown: [],
        consumption: [],
        savingsAnalysis: []
      };
    }
    
    const latestAuditId = latestAuditQuery.rows[0].id;
    
    // Get energy breakdown and consumption data from the most recent audit
    const energyDataQuery = await pool.query(`
      SELECT 
        rd.charts->>'energyBreakdown' as energy_breakdown,
        rd.charts->>'consumption' as consumption
      FROM report_data rd
      WHERE rd.audit_id = $1
    `, [latestAuditId]);
    
    // Get savings analysis data aggregated across all audits with implementations
    const savingsAnalysisQuery = await pool.query(`
      SELECT 
        rt.name as name,
        SUM(ar.estimated_savings) as estimated_savings,
        SUM(COALESCE(ar.actual_savings, 0)) as actual_savings
      FROM audit_recommendations ar
      JOIN energy_audits ea ON ar.audit_id = ea.id
      LEFT JOIN recommendation_types rt ON ar.type_id = rt.id
      WHERE ea.user_id = $1
      GROUP BY rt.name
      HAVING SUM(ar.estimated_savings) > 0
      ORDER BY SUM(ar.estimated_savings) DESC
    `, [userId]);
    
    // Parse the JSON data or use empty arrays if null
    let energyBreakdown: ChartDataPoint[] = [];
    let consumption: ChartDataPoint[] = [];
    
    if (energyDataQuery.rows.length > 0) {
      energyBreakdown = JSON.parse(energyDataQuery.rows[0].energy_breakdown || '[]');
      consumption = JSON.parse(energyDataQuery.rows[0].consumption || '[]');
    }
    
    // Format the savings analysis data
    const savingsAnalysis: SavingsChartDataPoint[] = savingsAnalysisQuery.rows.map((row: {
      name: string;
      estimated_savings: string;
      actual_savings: string;
    }) => ({
      name: row.name || 'General',
      estimatedSavings: parseFloat(row.estimated_savings),
      actualSavings: parseFloat(row.actual_savings)
    }));
    
    appLogger.debug('Fetched aggregated energy data', { 
      userId,
      energyBreakdownCount: energyBreakdown.length,
      consumptionCount: consumption.length,
      savingsAnalysisCount: savingsAnalysis.length
    });
    
    return {
      energyBreakdown,
      consumption,
      savingsAnalysis
    };
    
  } catch (error) {
    appLogger.error('Error fetching aggregated energy data', {
      error: error instanceof Error ? error.message : String(error),
      userId
    });
    throw error;
  }
}
