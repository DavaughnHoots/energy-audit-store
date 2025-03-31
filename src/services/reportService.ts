import { API_ENDPOINTS, API_BASE_URL, getApiUrl } from '../config/api';
import { ReportData, PaginatedAuditHistory } from '../types/report';
import { fetchWithAuth } from '../utils/authUtils';

/**
 * Validates that an audit ID is a non-empty string that's not "null"
 * @param auditId The audit ID to validate
 * @returns Boolean indicating if the audit ID is valid
 */
const isValidAuditId = (auditId: string | null | undefined): boolean => {
  return auditId !== null && auditId !== "null" && auditId !== undefined && auditId !== "";
};

/**
 * Fetches report data for the interactive preview
 * @param auditId The audit ID to fetch data for
 * @returns Promise resolving to the report data
 */
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
    return data;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
};

/**
 * Updates a recommendation's status and actual savings
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
    console.log(`Updating recommendation status: ID=${recommendationId}, status=${status}`);
    
    const response = await fetchWithAuth(
      getApiUrl(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_STATUS(recommendationId)),
      {
        method: 'PUT',
        body: JSON.stringify({
          status,
          actualSavings
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update recommendation status: ${response.status} ${response.statusText}`);
    }
    
    console.log('Recommendation status updated successfully');
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
      throw new Error(`Failed to update implementation details: ${response.status} ${response.statusText}`);
    }
    
    console.log('Implementation details updated successfully');
  } catch (error) {
    console.error('Error updating implementation details:', error);
    throw error;
  }
};
