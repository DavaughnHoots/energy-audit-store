import { API_ENDPOINTS, API_BASE_URL } from '../config/api';
import { ReportData } from '../types/report';

/**
 * Fetches report data for the interactive preview
 * @param auditId The audit ID to fetch data for
 * @returns Promise resolving to the report data
 */
export const fetchReportData = async (auditId: string): Promise<ReportData> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.REPORT_DATA(auditId)}`, 
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch report data: ${response.status} ${response.statusText}`);
    }

    return await response.json();
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
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RECOMMENDATIONS.UPDATE_STATUS(recommendationId)}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          actualSavings
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update recommendation status: ${response.status} ${response.statusText}`);
    }
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
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RECOMMENDATIONS.UPDATE_PRIORITY(recommendationId)}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update recommendation priority: ${response.status} ${response.statusText}`);
    }
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
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.RECOMMENDATIONS.UPDATE_DETAILS(recommendationId)}`,
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          implementationDate,
          implementationCost
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update implementation details: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating implementation details:', error);
    throw error;
  }
};
