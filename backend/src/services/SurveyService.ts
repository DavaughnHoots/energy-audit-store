import pool from '../config/database.js';
import { appLogger } from '../config/logger.js';

/**
 * Service for managing pilot study survey responses
 */
export class SurveyService {
  /**
   * Save a survey response submission to the database
   * 
   * @param userId - Optional user ID if the user is logged in
   * @param responses - Object containing all question answers
   * @param userAgent - Browser user agent
   * @param ipAddress - User's IP address
   * @param completionTime - Time taken to complete the survey in seconds
   * @returns The ID of the created survey response
   */
  static async saveResponse(
    userId: string | null,
    responses: Record<string, any>,
    userAgent: string | null,
    ipAddress: string | null,
    completionTime: number | null
  ): Promise<number> {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Create a new survey response record
      const insertResponseQuery = `
        INSERT INTO survey_responses (user_id, user_agent, ip_address, completion_time_seconds)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      
      const responseResult = await client.query(insertResponseQuery, [
        userId,
        userAgent,
        ipAddress,
        completionTime
      ]);
      
      const responseId = responseResult.rows[0].id;
      
      // Insert each question answer
      for (const [questionId, value] of Object.entries(responses)) {
        // Extract section and type from the questionId
        // Format is expected to be like 'ui-intuitive' (for usability section)
        const questionInfo = this.getQuestionInfo(questionId);
        
        let likertValue = null;
        let textValue = null;
        let checkboxValues = null;
        
        // Set the appropriate value based on question type
        if (questionInfo.type === 'likert') {
          likertValue = typeof value === 'number' ? value : null;
        } else if (questionInfo.type === 'text') {
          textValue = typeof value === 'string' ? value : null;
        } else if (questionInfo.type === 'checkbox') {
          checkboxValues = Array.isArray(value) ? JSON.stringify(value) : null;
        }
        
        await client.query(`
          INSERT INTO survey_response_answers 
          (response_id, question_id, question_section, question_type, likert_value, text_value, checkbox_values)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          responseId,
          questionId,
          questionInfo.section,
          questionInfo.type,
          likertValue,
          textValue,
          checkboxValues
        ]);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      appLogger.info(`Survey response saved with ID: ${responseId}`);
      return responseId;
      
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      appLogger.error('Error saving survey response:', { error });
      throw error;
    } finally {
      // Release client back to pool
      client.release();
    }
  }
  
  /**
   * Get the summary of survey responses for analysis
   * 
   * @returns Summary statistics of survey responses
   */
  static async getSurveySummary() {
    try {
      // Get count of total responses
      const totalResponsesQuery = `
        SELECT COUNT(*) as total_responses
        FROM survey_responses
      `;
      const totalResponsesResult = await pool.query(totalResponsesQuery);
      const totalResponses = parseInt(totalResponsesResult.rows[0].total_responses);
      
      // Get average Likert ratings by question
      const likertRatingsQuery = `
        SELECT 
          question_id,
          AVG(likert_value) as average_rating,
          COUNT(*) as response_count
        FROM survey_response_answers
        WHERE question_type = 'likert'
        GROUP BY question_id
        ORDER BY average_rating DESC
      `;
      const likertRatingsResult = await pool.query(likertRatingsQuery);
      
      // Get most common feature selections
      const featureSelectionsQuery = `
        SELECT 
          jsonb_array_elements_text(checkbox_values) as selected_feature,
          COUNT(*) as selection_count
        FROM survey_response_answers
        WHERE question_id = 'most-useful' AND checkbox_values IS NOT NULL
        GROUP BY selected_feature
        ORDER BY selection_count DESC
      `;
      const featureSelectionsResult = await pool.query(featureSelectionsQuery);
      
      // Return combined summary
      return {
        totalResponses,
        likertRatings: likertRatingsResult.rows,
        popularFeatures: featureSelectionsResult.rows
      };
      
    } catch (error) {
      appLogger.error('Error getting survey summary:', { error });
      throw error;
    }
  }
  
  /**
   * Get paginated survey responses for admin dashboard
   * 
   * @param page - Page number (1-based)
   * @param limit - Number of responses per page
   * @returns Paginated survey responses with total count
   */
  static async getPaginatedResponses(page: number = 1, limit: number = 5): Promise<{
    responses: Array<{
      id: number;
      user_id: string | null;
      submission_date: Date;
      user_agent: string | null;
      completion_time_seconds: number | null;
      sections: string[];
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM survey_responses
      `;
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);
      
      // Calculate pagination values
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(total / limit);
      
      // Query for paginated responses
      const query = `
        WITH response_sections AS (
          SELECT 
            response_id,
            ARRAY_AGG(DISTINCT question_section) as sections
          FROM survey_response_answers
          GROUP BY response_id
        )
        SELECT 
          sr.id,
          sr.user_id,
          sr.submission_date,
          sr.user_agent,
          sr.completion_time_seconds,
          COALESCE(rs.sections, ARRAY[]::text[]) as sections
        FROM survey_responses sr
        LEFT JOIN response_sections rs ON sr.id = rs.response_id
        ORDER BY sr.submission_date DESC
        LIMIT $1 OFFSET $2
      `;
      
      const result = await pool.query(query, [limit, offset]);
      
      return {
        responses: result.rows,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      appLogger.error('Error getting paginated survey responses:', { error });
      throw error;
    }
  }
  
  /**
   * Get a specific survey response by ID with all its answers
   * 
   * @param id - Survey response ID
   * @returns Survey response with answer details or null if not found
   */
  static async getResponseById(id: number | string): Promise<{
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
  } | null> {
    try {
      // Get the base response details
      const responseQuery = `
        SELECT id, submission_date, user_id, completion_time_seconds
        FROM survey_responses
        WHERE id = $1
      `;
      
      const responseResult = await pool.query(responseQuery, [id]);
      
      if (responseResult.rows.length === 0) {
        return null;
      }
      
      const response = responseResult.rows[0];
      
      // Get all the answers for this response
      const answersQuery = `
        SELECT 
          question_id,
          question_section,
          question_type,
          likert_value,
          text_value,
          checkbox_values
        FROM survey_response_answers
        WHERE response_id = $1
        ORDER BY question_section, question_id
      `;
      
      const answersResult = await pool.query(answersQuery, [id]);
      
      // Define type for row data
      interface AnswerRow {
        question_id: string;
        question_section: string;
        question_type: string;
        likert_value: number | null;
        text_value: string | null;
        checkbox_values: any;
      }
      
      // Process checkbox_values - handle both string and already parsed JSON
      const answers = answersResult.rows.map((row: AnswerRow) => {
        try {
          return {
            ...row,
            checkbox_values: row.checkbox_values 
              ? (typeof row.checkbox_values === 'string' 
                  ? JSON.parse(row.checkbox_values) 
                  : row.checkbox_values)
              : null
          };
        } catch (error) {
          appLogger.error('Error processing checkbox_values:', { 
            error, 
            responseId: id, 
            value: row.checkbox_values,
            valueType: typeof row.checkbox_values 
          });
          
          // Return with original value to prevent complete failure
          return {
            ...row, 
            checkbox_values: row.checkbox_values
          };
        }
      });
      
      return {
        ...response,
        answers
      };
    } catch (error) {
      appLogger.error('Error getting survey response by ID:', { error });
      throw error;
    }
  }
  
  /**
   * Get all text responses for analysis
   * 
   * @returns All text responses grouped by question
   */
  static async getTextResponses() {
    try {
      const query = `
        SELECT 
          question_id,
          text_value,
          survey_responses.submission_date
        FROM survey_response_answers
        JOIN survey_responses ON survey_response_answers.response_id = survey_responses.id
        WHERE question_type = 'text' AND text_value IS NOT NULL AND text_value != ''
        ORDER BY survey_responses.submission_date DESC
      `;
      
      const result = await pool.query(query);
      
      // Define the interface for the response row
      interface TextResponseRow {
        question_id: string;
        text_value: string;
        submission_date: Date;
      }
      
      // Group by question_id
      const groupedResponses: Record<string, any[]> = {};
      
      result.rows.forEach((row: TextResponseRow) => {
        if (!groupedResponses[row.question_id]) {
          groupedResponses[row.question_id] = [];
        }
        
        groupedResponses[row.question_id].push({
          text: row.text_value,
          date: row.submission_date
        });
      });
      
      return groupedResponses;
      
    } catch (error) {
      appLogger.error('Error getting text responses:', { error });
      throw error;
    }
  }
  
  /**
   * Helper method to determine question section and type from question ID
   */
  private static getQuestionInfo(questionId: string): { section: string, type: string } {
    // Default section and type
    let section = 'unknown';
    let type = 'text';
    
    // Extract section from question ID
    if (questionId.startsWith('ui-')) {
      section = 'usability';
    } else if (questionId === 'most-useful' || questionId === 'feature-improvements') {
      section = 'features';
    } else if (questionId === 'recommendation-likelihood' || questionId === 'overall-feedback') {
      section = 'overall';
    }
    
    // Determine type based on question ID
    if (questionId === 'ui-intuitive' || questionId === 'energy-audit-helpful' || questionId === 'recommendation-likelihood') {
      type = 'likert';
    } else if (questionId === 'most-useful') {
      type = 'checkbox';
    } else {
      type = 'text';
    }
    
    return { section, type };
  }
}

export default SurveyService;
