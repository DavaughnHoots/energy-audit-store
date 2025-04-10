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
  }
};

export default SurveyApiService;
