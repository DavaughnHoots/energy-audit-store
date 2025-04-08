import { pool } from '../config/database.js';
import { appLogger } from '../config/logger.js';
import { ReportGenerationService } from './report-generation/ReportGenerationService.js';

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
  const startTime = Date.now();
  try {
    appLogger.info('Starting unique recommendations fetch', { 
      userId, 
      method: 'getUniqueRecommendationsByType',
      timestamp: new Date().toISOString()
    });
    
    appLogger.debug('Executing recommendations query for user', { userId });
    
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
    
    appLogger.debug('Recommendations query completed', { 
      userId, 
      rowCount: recommendationsQuery.rows.length,
      queryTimeMs: Date.now() - startTime
    });
    
    if (recommendationsQuery.rows.length === 0) {
      appLogger.info('No recommendations found for user', { userId });
      return [];
    }
    
    // Log example recommendation to help with debugging
    if (recommendationsQuery.rows.length > 0) {
      appLogger.debug('Example recommendation from database', {
        userId,
        sampleRecommendation: {
          id: recommendationsQuery.rows[0].id,
          title: recommendationsQuery.rows[0].title,
          type: recommendationsQuery.rows[0].type || 'general',
          estimatedSavings: recommendationsQuery.rows[0].estimated_savings,
          hasActualSavings: recommendationsQuery.rows[0].actual_savings !== null
        }
      });
    }
    
    // Group recommendations by type
    appLogger.debug('Grouping recommendations by type', { userId });
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
    
    // Log the types found
    const recommendationTypes = Object.keys(recommendationsByType);
    appLogger.debug('Recommendation types found', { 
      userId, 
      types: recommendationTypes,
      typeCounts: recommendationTypes.map(type => ({
        type,
        count: recommendationsByType[type].length
      }))
    });
    
    // Select the most recent recommendation for each type
    appLogger.debug('Selecting most recent recommendation of each type', { userId });
    const uniqueRecommendations: AuditRecommendation[] = [];
    
    for (const type in recommendationsByType) {
      // The recommendations are already sorted by created_at DESC, so the first one is the most recent
      const mostRecent = recommendationsByType[type][0];
      uniqueRecommendations.push(mostRecent);
      
      appLogger.debug(`Selected recommendation for type: ${type}`, {
        userId,
        recommendationId: mostRecent.id,
        title: mostRecent.title,
        priority: mostRecent.priority,
        estimatedSavings: mostRecent.estimatedSavings
      });
    }
    
    // Sort by priority (high → medium → low) and then by estimated savings (highest first)
    appLogger.debug('Sorting recommendations by priority and savings', { userId });
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
    
    appLogger.info('Successfully fetched unique recommendations by type', { 
      userId, 
      uniqueCount: uniqueRecommendations.length,
      typeCount: Object.keys(recommendationsByType).length,
      executionTimeMs: Date.now() - startTime
    });
    
    // Log the final sorted list
    appLogger.debug('Final sorted recommendations', {
      userId,
      recommendations: uniqueRecommendations.map(rec => ({
        id: rec.id,
        title: rec.title,
        type: rec.type,
        priority: rec.priority,
        estimatedSavings: rec.estimatedSavings
      }))
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
  const startTime = Date.now();
  try {
    appLogger.info('Starting aggregated energy data fetch using ReportGenerationService', { 
      userId, 
      method: 'getAggregatedEnergyData',
      timestamp: new Date().toISOString()
    });
    
    // Find the most recent audit for the user
    appLogger.debug('Finding most recent audit for user', { userId });
    const latestAuditQuery = await pool.query(`
      SELECT id, data
      FROM energy_audits
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);
    
    appLogger.debug('Latest audit query completed', { 
      userId,
      found: latestAuditQuery.rows.length > 0,
      auditId: latestAuditQuery.rows[0]?.id || 'none'
    });
    
    if (latestAuditQuery.rows.length === 0) {
      appLogger.info('No audits found for user, returning empty energy data', { userId });
      return {
        energyBreakdown: [],
        consumption: [],
        savingsAnalysis: []
      };
    }
    
    const latestAuditId = latestAuditQuery.rows[0].id;
    
    // First approach: Get energy data from the report_data table
    appLogger.debug('Querying report_data for pre-generated chart data', { 
      userId, 
      auditId: latestAuditId 
    });
    
    const energyDataQuery = await pool.query(`
      SELECT 
        rd.charts->>'energyBreakdown' as energy_breakdown,
        rd.charts->>'consumption' as consumption
      FROM report_data rd
      WHERE rd.audit_id = $1
    `, [latestAuditId]);
    
    appLogger.debug('Report data query results', { 
      userId, 
      auditId: latestAuditId,
      hasEnergyBreakdown: !!energyDataQuery.rows[0]?.energy_breakdown,
      hasConsumption: !!energyDataQuery.rows[0]?.consumption
    });
    
    // Second approach: Generate energy data using ReportGenerationService
    // Try to parse the audit data JSON
    let auditData;
    try {
      auditData = latestAuditQuery.rows[0].data;
      appLogger.debug('Successfully extracted audit data', { 
        userId, 
        auditId: latestAuditId,
        dataSize: JSON.stringify(auditData).length
      });
    } catch (error) {
      appLogger.error('Error parsing audit data JSON', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        auditId: latestAuditId
      });
    }
    
    // Get savings analysis data aggregated across all audits with implementations
    appLogger.debug('Getting aggregated savings analysis data across all audits', { userId });
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
    
    appLogger.debug('Savings analysis query results', { 
      userId,
      rowCount: savingsAnalysisQuery.rows.length
    });
    
    // Parse the JSON data or use empty arrays if null
    let energyBreakdown: ChartDataPoint[] = [];
    let consumption: ChartDataPoint[] = [];
    
    if (energyDataQuery.rows.length > 0 && energyDataQuery.rows[0].energy_breakdown) {
      try {
        energyBreakdown = JSON.parse(energyDataQuery.rows[0].energy_breakdown);
        appLogger.debug('Successfully parsed energy breakdown data from report_data', { 
          userId,
          dataPointCount: energyBreakdown.length
        });
      } catch (error) {
        appLogger.error('Error parsing energy breakdown JSON', {
          error: error instanceof Error ? error.message : String(error),
          userId
        });
      }
    }
    
    if (energyDataQuery.rows.length > 0 && energyDataQuery.rows[0].consumption) {
      try {
        consumption = JSON.parse(energyDataQuery.rows[0].consumption);
        appLogger.debug('Successfully parsed consumption data from report_data', { 
          userId,
          dataPointCount: consumption.length
        });
      } catch (error) {
        appLogger.error('Error parsing consumption JSON', {
          error: error instanceof Error ? error.message : String(error),
          userId
        });
      }
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
    
    appLogger.info('Successfully aggregated energy data', { 
      userId,
      energyBreakdownCount: energyBreakdown.length,
      consumptionCount: consumption.length,
      savingsAnalysisCount: savingsAnalysis.length,
      executionTimeMs: Date.now() - startTime
    });
    
    // Log a sample of the data for debugging
    if (energyBreakdown.length > 0) {
      appLogger.debug('Energy breakdown sample', {
        userId,
        sample: energyBreakdown.slice(0, 2)
      });
    }
    
    if (consumption.length > 0) {
      appLogger.debug('Consumption sample', {
        userId,
        sample: consumption.slice(0, 2)
      });
    }
    
    if (savingsAnalysis.length > 0) {
      appLogger.debug('Savings analysis sample', {
        userId,
        sample: savingsAnalysis.slice(0, 2)
      });
    }
    
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
