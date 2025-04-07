/**
 * Dashboard Data Merge Utility
 * 
 * Handles intelligent merging of dashboard data from multiple sources
 * to ensure that valid recommendation and chart data is preserved
 */

/**
 * Merges dashboard stats data while preserving valuable data from both sources
 * 
 * @param prevStats Previous dashboard stats state
 * @param newData New dashboard stats data
 * @returns Merged dashboard stats with the best data from both sources
 */
export function mergeDashboardData(prevStats: any, newData: any): any {
  if (!newData) return prevStats;
  if (!prevStats) return newData;
  
  // Create base merged data from new data
  const mergedData = { ...newData };
  
  // Preserve recommendations if new data has none but previous state had some
  if ((!newData.enhancedRecommendations || newData.enhancedRecommendations.length === 0) && 
      prevStats.enhancedRecommendations && prevStats.enhancedRecommendations.length > 0) {
    console.log('Preserving existing recommendations:', {
      existingCount: prevStats.enhancedRecommendations.length,
      newCount: newData.enhancedRecommendations?.length || 0
    });
    mergedData.enhancedRecommendations = prevStats.enhancedRecommendations;
  }
  
  // Preserve energy analysis chart data if new data is missing but previous state had it
  if (mergedData.energyAnalysis) {
    // For Energy Breakdown
    if ((!newData.energyAnalysis?.energyBreakdown || newData.energyAnalysis.energyBreakdown.length === 0) &&
        prevStats.energyAnalysis?.energyBreakdown && prevStats.energyAnalysis.energyBreakdown.length > 0) {
      console.log('Preserving existing energy breakdown data');
      mergedData.energyAnalysis.energyBreakdown = prevStats.energyAnalysis.energyBreakdown;
    }
    
    // For Consumption
    if ((!newData.energyAnalysis?.consumption || newData.energyAnalysis.consumption.length === 0) &&
        prevStats.energyAnalysis?.consumption && prevStats.energyAnalysis.consumption.length > 0) {
      console.log('Preserving existing consumption data');
      mergedData.energyAnalysis.consumption = prevStats.energyAnalysis.consumption;
    }
    
    // For Savings Analysis
    if ((!newData.energyAnalysis?.savingsAnalysis || newData.energyAnalysis.savingsAnalysis.length === 0) &&
        prevStats.energyAnalysis?.savingsAnalysis && prevStats.energyAnalysis.savingsAnalysis.length > 0) {
      console.log('Preserving existing savings analysis data');
      mergedData.energyAnalysis.savingsAnalysis = prevStats.energyAnalysis.savingsAnalysis;
    }
  } else if (prevStats.energyAnalysis) {
    // If new data has no energy analysis at all but previous state did, preserve it entirely
    console.log('Restoring entire energy analysis section from previous state');
    mergedData.energyAnalysis = prevStats.energyAnalysis;
  }
  
  // Check if we need to carry over source audit ID
  if (!newData.latestAuditId && prevStats.latestAuditId) {
    console.log('Preserving audit ID from previous state:', prevStats.latestAuditId);
    mergedData.latestAuditId = prevStats.latestAuditId;
  }
  
  // Preserve data source metadata if previously set
  if (!newData.dataSummary && prevStats.dataSummary) {
    mergedData.dataSummary = prevStats.dataSummary;
  }
  
  return mergedData;
}

/**
 * Determines if the new data has overwritten existing recommendation data
 * to help with debugging data flow issues
 * 
 * @param prevStats Previous dashboard stats 
 * @param newData New dashboard stats data
 * @returns Boolean indicating if recommendations were overwritten
 */
export function didOverwriteRecommendations(prevStats: any, newData: any): boolean {
  if (!prevStats || !newData) return false;
  
  return (
    prevStats.enhancedRecommendations?.length > 0 && 
    (!newData.enhancedRecommendations || newData.enhancedRecommendations.length === 0)
  );
}
