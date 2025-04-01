import { appLogger, createLogMetadata } from '../utils/logger.js';
import { pool } from '../config/database.js';
import { RecommendationUpdate } from '../types/recommendationUpdate.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to handle recommendation updates
 * Manages user-specific changes to recommendations
 */
export class RecommendationUpdateService {
  /**
   * Save or update user-specific recommendation changes
   * If an existing update exists for this user/recommendation, it will be updated
   * Otherwise, a new record will be created
   * 
   * @param recommendationId The ID of the recommendation to update
   * @param userId The ID of the user making the update
   * @param updates The updates to apply (status, priority, actualSavings, etc.)
   * @returns The updated recommendation data
   */
  async saveUpdate(
    recommendationId: string,
    userId: string,
    updates: {
      status?: 'active' | 'implemented';
      priority?: 'high' | 'medium' | 'low';
      actualSavings?: number;
      implementationDate?: string;
      implementationCost?: number;
    }
  ): Promise<RecommendationUpdate> {
    appLogger.info('Saving recommendation update', {
      recommendationId,
      userId,
      updates: { ...updates }
    });
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if an update already exists for this recommendation and user
      const checkResult = await client.query(
        `SELECT id FROM recommendation_updates WHERE recommendation_id = $1 AND user_id = $2`,
        [recommendationId, userId]
      );
      
      let result;
      
      if (checkResult.rows.length > 0) {
        // Update existing record
        const updateId = checkResult.rows[0].id;
        
        // Build dynamic update query based on provided fields
        const fields = [];
        const values = [];
        let paramIndex = 1;
        
        if (updates.status !== undefined) {
          fields.push(`status = $${paramIndex}`);
          values.push(updates.status);
          paramIndex++;
        }
        
        if (updates.priority !== undefined) {
          fields.push(`priority = $${paramIndex}`);
          values.push(updates.priority);
          paramIndex++;
        }
        
        if (updates.actualSavings !== undefined) {
          fields.push(`actual_savings = $${paramIndex}`);
          values.push(updates.actualSavings);
          paramIndex++;
        }
        
        if (updates.implementationDate !== undefined) {
          fields.push(`implementation_date = $${paramIndex}`);
          values.push(updates.implementationDate);
          paramIndex++;
        }
        
        if (updates.implementationCost !== undefined) {
          fields.push(`implementation_cost = $${paramIndex}`);
          values.push(updates.implementationCost);
          paramIndex++;
        }
        
        // Always update the timestamp
        fields.push(`updated_at = NOW()`);
        
        // Add the update ID as the last parameter
        values.push(updateId);
        
        const updateQuery = `
          UPDATE recommendation_updates 
          SET ${fields.join(', ')} 
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        
        result = await client.query(updateQuery, values);
        
        appLogger.info('Updated existing recommendation update', {
          updateId,
          recommendationId,
          userId
        });
      } else {
        // Create new record
        const insertId = uuidv4();
        
        result = await client.query(
          `INSERT INTO recommendation_updates (
            id, recommendation_id, user_id, status, priority, 
            actual_savings, implementation_date, implementation_cost, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *`,
          [
            insertId,
            recommendationId,
            userId,
            updates.status,
            updates.priority,
            updates.actualSavings,
            updates.implementationDate,
            updates.implementationCost
          ]
        );
        
        appLogger.info('Created new recommendation update', {
          insertId,
          recommendationId,
          userId
        });
      }
      
      await client.query('COMMIT');
      
      // Transform the database row to our RecommendationUpdate type
      const row = result.rows[0];
      return {
        id: row.id,
        recommendationId: row.recommendation_id,
        userId: row.user_id,
        status: row.status,
        priority: row.priority,
        actualSavings: row.actual_savings,
        implementationDate: row.implementation_date ? row.implementation_date.toISOString().split('T')[0] : null,
        implementationCost: row.implementation_cost,
        updatedAt: row.updated_at.toISOString()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      
      appLogger.error('Error saving recommendation update', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        recommendationId,
        userId
      });
      
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get all updates for a specific recommendation
   * @param recommendationId The ID of the recommendation
   * @returns Array of updates for this recommendation
   */
  async getUpdatesByRecommendationId(recommendationId: string): Promise<RecommendationUpdate[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM recommendation_updates WHERE recommendation_id = $1`,
        [recommendationId]
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        recommendationId: row.recommendation_id,
        userId: row.user_id,
        status: row.status,
        priority: row.priority,
        actualSavings: row.actual_savings,
        implementationDate: row.implementation_date ? row.implementation_date.toISOString().split('T')[0] : null,
        implementationCost: row.implementation_cost,
        updatedAt: row.updated_at.toISOString()
      }));
    } catch (error) {
      appLogger.error('Error getting recommendation updates', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        recommendationId
      });
      
      throw error;
    }
  }
  
  /**
   * Get all updates for a specific user
   * @param userId The ID of the user
   * @returns Array of updates made by this user
   */
  async getUpdatesByUserId(userId: string): Promise<RecommendationUpdate[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM recommendation_updates WHERE user_id = $1`,
        [userId]
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        recommendationId: row.recommendation_id,
        userId: row.user_id,
        status: row.status,
        priority: row.priority,
        actualSavings: row.actual_savings,
        implementationDate: row.implementation_date ? row.implementation_date.toISOString().split('T')[0] : null,
        implementationCost: row.implementation_cost,
        updatedAt: row.updated_at.toISOString()
      }));
    } catch (error) {
      appLogger.error('Error getting user recommendation updates', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId
      });
      
      throw error;
    }
  }
  
  /**
   * Delete a specific recommendation update
   * @param updateId The ID of the update to delete
   * @param userId The ID of the user (for authorization)
   * @returns True if the update was deleted
   */
  async deleteUpdate(updateId: string, userId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Verify the user owns this update
      const checkResult = await client.query(
        `SELECT id FROM recommendation_updates WHERE id = $1 AND user_id = $2`,
        [updateId, userId]
      );
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return false; // User is not authorized to delete this update
      }
      
      // Delete the update
      await client.query(
        `DELETE FROM recommendation_updates WHERE id = $1`,
        [updateId]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      
      appLogger.error('Error deleting recommendation update', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        updateId,
        userId
      });
      
      throw error;
    } finally {
      client.release();
    }
  }
}

export const recommendationUpdateService = new RecommendationUpdateService();
