import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/**
 * Service for interacting with the survey API endpoints
 */
export const SurveyApiService = {
  /**
   * Submit a survey response to the backend
   * 
   * @param responses - Object containing all question answers
   * @param completionTime - Time taken to complete the survey in seconds
   * @returns Promise with the API response
   */
  async submitSurveyResponse(data: {
    responses: Record<string, any>;
    completionTime?: number;
  }): Promise<{
    success: boolean;
    message: string;
    responseId?: number;
  }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/survey/responses`, data);
      return response.data;
    } catch (error) {
      console.error('Error submitting survey response:', error);
      return {
        success: false,
        message: 'Failed to submit survey response. Please try again.'
      };
    }
  },

  /**
   * Get summary statistics of survey responses (admin only)
   * 
   * @returns Promise with summary data
   */
  async getSurveySummary(): Promise<{
    totalResponses: number;
    likertRatings: Array<{
      question_id: string;
      average_rating: number;
      response_count: number;
    }>;
    popularFeatures: Array<{
      selected_feature: string;
      selection_count: number;
    }>;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/survey/summary`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching survey summary:', error);
      throw new Error('Failed to fetch survey summary');
    }
  },

  /**
   * Get all text responses for analysis (admin only)
   * 
   * @returns Promise with text responses grouped by question
   */
  async getTextResponses(): Promise<Record<string, Array<{
    text: string;
    date: string;
  }>>> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/survey/text-responses`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching text responses:', error);
      throw new Error('Failed to fetch text responses');
    }
  },

  /**
   * Get paginated survey responses (admin only)
   * 
   * @param page - Page number (1-based)
   * @param limit - Number of responses per page
   * @returns Promise with paginated survey responses
   */
  async getPaginatedResponses(page: number = 1, limit: number = 5): Promise<{
    responses: Array<{
      id: number;
      user_id: string | null;
      submission_date: Date;
      completion_time_seconds: number | null;
      sections: string[];
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/survey/admin/responses`, {
        params: { page, limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      throw new Error('Failed to fetch survey responses');
    }
  },

  /**
   * Get a specific survey response by ID (admin only)
   * 
   * @param id - Survey response ID
   * @returns Promise with the survey response data
   */
  async getResponseById(id: string | number): Promise<{
    id: number;
    submission_date: Date;
    user_id: string | null;
    completion_time_seconds: number | null;
    answers: Array<{
      question_id: string;
      question_section: string;
      question_type: string;
      likert_value: number | null;
      text_value: string | null;
      checkbox_values: string[] | null;
    }>;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/survey/responses/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching survey response ${id}:`, error);
      throw new Error('Failed to fetch survey response');
    }
  }
};

export default SurveyApiService;
