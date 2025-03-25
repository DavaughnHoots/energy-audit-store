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
