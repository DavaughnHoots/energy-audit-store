import { API_ENDPOINTS, API_BASE_URL, getApiUrl } from '../config/api';
import { ReportData, PaginatedAuditHistory, SavingsChartDataPoint } from '../types/report';
import { fetchWithAuth } from '../utils/authUtils';
import { getRecommendationSavings, getActualSavings } from '../utils/financialCalculations';

/**
 * V2.2: Enhanced version with data validation and error handling improvements
 * Ensures that savings data points have valid non-zero values by using a safe
 * property access approach. This addresses inconsistencies between different
 * data sources in the application.
 * 
 * @param data Array of data points to transform
 * @returns Transformed data with consistent non-zero values where available
 */
export const ensureNonZeroValues = (data: SavingsChartDataPoint[]): SavingsChartDataPoint[] => {
  console.log('ensureNonZeroValues v2.2 called with data:', data);
  
  if (!data || !Array.isArray(data)) {
    console.warn('ensureNonZeroValues received invalid data:', data);
    return [];
  }
  
  const transformedData = data.map(item => {
    // Log the raw input item
    console.log(`[DataTransform][${item.name}] Raw input:`, JSON.stringify(item));
    
    // Create a standardized object we'll return
    const standardizedItem: SavingsChartDataPoint = {
      name: item.name,
      estimatedSavings: 0,
      actualSavings: 0
    };
    
    // Safely extract the estimated savings value from any possible field name
    // Using type assertion with 'any' to allow flexible property access
    const dataItem = item as any;
    
    // For estimated savings - check all possible field names
    if (typeof dataItem.estimatedSavings === 'number' && !isNaN(dataItem.estimatedSavings)) {
      standardizedItem.estimatedSavings = dataItem.estimatedSavings;
      console.log(`[DataTransform][${item.name}] Using direct estimatedSavings:`, dataItem.estimatedSavings);
    } else if (typeof dataItem.estimated_savings === 'number' && !isNaN(dataItem.estimated_savings)) {
      standardizedItem.estimatedSavings = dataItem.estimated_savings;
      console.log(`[DataTransform][${item.name}] Using snake_case estimated_savings:`, dataItem.estimated_savings);
    } else if (typeof dataItem.estimated === 'number' && !isNaN(dataItem.estimated)) {
      standardizedItem.estimatedSavings = dataItem.estimated;
      console.log(`[DataTransform][${item.name}] Using shorthand estimated:`, dataItem.estimated);
    } else {
      console.warn(`[DataTransform][${item.name}] No valid estimated savings found in:`, dataItem);
    }
    
    // For actual savings - check all possible field names
    if (typeof dataItem.actualSavings === 'number' && !isNaN(dataItem.actualSavings)) {
      standardizedItem.actualSavings = dataItem.actualSavings;
      console.log(`[DataTransform][${item.name}] Using direct actualSavings:`, dataItem.actualSavings);
    } else if (typeof dataItem.actual_savings === 'number' && !isNaN(dataItem.actual_savings)) {
      standardizedItem.actualSavings = dataItem.actual_savings;
      console.log(`[DataTransform][${item.name}] Using snake_case actual_savings:`, dataItem.actual_savings);
    } else if (typeof dataItem.actual === 'number' && !isNaN(dataItem.actual)) {
      standardizedItem.actualSavings = dataItem.actual;
      console.log(`[DataTransform][${item.name}] Using shorthand actual:`, dataItem.actual);
    } else {
      console.warn(`[DataTransform][${item.name}] No valid actual savings found in:`, dataItem);
    }
    
    console.log(`[DataTransform][${item.name}] Final transformed data:`, standardizedItem);
    
    return standardizedItem;
  });
  
  console.log('ensureNonZeroValues final result:', transformedData);
  return transformedData;
};

/**
 * Validates that an audit ID is a non-empty string that's not "null"
 * @param auditId The audit ID to validate
 * @returns Boolean indicating if the audit ID is valid
 */
const isValidAuditId = (auditId: string | null | undefined): boolean => {
  return auditId !== null && auditId !== "null" && auditId !== undefined && auditId !== "";
};

/**
 * Fetches paginated audit history for the current user
 * @param page Page number (default: 1)
 * @param limit Number of records per page (default: 5)
 * @returns Promise resolving to paginated audit history
 */
export const fetchAuditHistory = async (
  page = 1,
  limit = 5
): Promise<PaginatedAuditHistory> => {
  try {
    console.log(`Fetching audit history: page=${page}, limit=${limit}`);
    
    const response = await fetchWithAuth(
      getApiUrl(`${API_ENDPOINTS.AUDIT_HISTORY}?page=${page}&limit=${limit}`),
      { 
        method: 'GET',
        credentials: 'include' // Ensure cookies are sent with the request
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch audit history: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully retrieved audit history', data);
    return data;
  } catch (error) {
    console.error('Error fetching audit history:', error);
    throw error;
  }
};

/**
 * Fetches report data for the interactive preview
 * @param auditId The audit ID to fetch data for
 * @returns Promise resolving to the report data
 */
export const fetchReportData = async (auditId: string): Promise<ReportData> => {
  try {
    console.log('Fetching report data for audit ID:', auditId);
    
    // Validate the audit ID before making the API call
    if (!isValidAuditId(auditId)) {
      throw new Error(`Invalid audit ID: ${auditId}`);
    }
    
    // Use the fetchWithAuth utility which handles retries and token refresh
    const response = await fetchWithAuth(
      getApiUrl(API_ENDPOINTS.REPORT_DATA(auditId)),
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch report data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Successfully retrieved report data');
    
    // Apply data transformations to ensure financial data consistency
    if (data?.charts?.savingsAnalysis) {
      console.log('Before transformation - savingsAnalysis chart data:', JSON.stringify(data.charts.savingsAnalysis));
      data.charts.savingsAnalysis = ensureNonZeroValues(data.charts.savingsAnalysis);
      console.log('After transformation - savingsAnalysis chart data:', JSON.stringify(data.charts.savingsAnalysis));
      console.log('Applied financial data consistency transformations to savings chart data v2.2');
    } else {
      console.warn('No savingsAnalysis data found in the response');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
};

/**
 * Updates a recommendation's status and actual savings
 * 
 * Enhanced version v2.0: Now properly provides implementationDate when needed
 * and includes better error handling
 * 
 * @param recommendationId The recommendation ID to update
 * @param status New status ('active' or 'implemented')
 * @param actualSavings Optional actual savings amount
 * @returns Promise resolving when the update is complete
 */
export const updateRecommendationStatus = async (
  recommendationId: string,
  status: 'active' | 'implemented',
  actualSavings?: number
): Promise<void> => {
  try {
    console.log(`Updating recommendation status: ID=${recommendationId}, status=${status}, actual savings=${actualSavings}`);
    
    // Construct payload with default date if needed
    const payload: any = { status };
    
    // Only include actual savings if it's a valid number
    if (typeof actualSavings === 'number' && !isNaN(actualSavings)) {
      payload.actualSavings = actualSavings;
    }
    
    // If implementing and no date provided, use current date
    if (status === 'implemented') {
      payload.implementationDate = new Date().toISOString().split('T')[0];
    }
    
    console.log('Sending update status payload:', payload);
    
    const response = await fetchWithAuth(
      getApiUrl(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_STATUS(recommendationId)),
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Status update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update recommendation status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Recommendation status updated successfully', result);
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    throw error;
  }
};

/**
 * Updates a recommendation's priority
 * @param recommendationId The recommendation ID to update
 * @param priority New priority level ('high', 'medium', or 'low')
 * @returns Promise resolving when the update is complete
 */
export const updateRecommendationPriority = async (
  recommendationId: string,
  priority: 'high' | 'medium' | 'low'
): Promise<void> => {
  try {
    console.log(`Updating recommendation priority: ID=${recommendationId}, priority=${priority}`);
    
    const response = await fetchWithAuth(
      getApiUrl(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_PRIORITY(recommendationId)),
      {
        method: 'PUT',
        body: JSON.stringify({ priority })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update recommendation priority: ${response.status} ${response.statusText}`);
    }
    
    console.log('Recommendation priority updated successfully');
  } catch (error) {
    console.error('Error updating recommendation priority:', error);
    throw error;
  }
};

/**
 * Updates a recommendation's implementation details
 * 
 * Enhanced version v2.0: Improved error handling, validation, and detailed logging
 * 
 * @param recommendationId The recommendation ID to update
 * @param implementationDate Date of implementation
 * @param implementationCost Actual cost of implementation
 * @returns Promise resolving when the update is complete
 */
export const updateImplementationDetails = async (
  recommendationId: string,
  implementationDate: string,
  implementationCost: number
): Promise<void> => {
  try {
    console.log(`Updating implementation details: ID=${recommendationId}, date=${implementationDate}, cost=${implementationCost}`);
    
    // Validate inputs
    if (!implementationDate) {
      throw new Error('Implementation date is required');
    }
    
    if (typeof implementationCost !== 'number' || isNaN(implementationCost)) {
      throw new Error('Implementation cost must be a valid number');
    }
    
    const response = await fetchWithAuth(
      getApiUrl(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_DETAILS(recommendationId)),
      {
        method: 'PUT',
        body: JSON.stringify({
          implementationDate,
          implementationCost
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Implementation details update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update implementation details: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Implementation details updated successfully', result);
  } catch (error) {
    console.error('Error updating implementation details:', error);
    throw error;
  }
};
