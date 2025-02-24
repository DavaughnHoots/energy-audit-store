import { Pool } from 'pg';
import pool from '../config/database.js';
import { appLogger } from '../config/logger.js';
import {
  WindowMaintenance,
  WeatherizationMonitoring,
  UpdateWindowMaintenanceDto,
  UpdateWeatherizationDto
} from '../types/propertySettings';

class PropertySettingsService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getWindowMaintenance(userId: string): Promise<WindowMaintenance> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM window_maintenance WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default record if none exists
        const insertResult = await this.pool.query(
          `INSERT INTO window_maintenance (user_id, window_count)
           VALUES ($1, 0)
           RETURNING *`,
          [userId]
        );
        return insertResult.rows[0];
      }

      return result.rows[0];
    } catch (error) {
      appLogger.error('Error fetching window maintenance:', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  async updateWindowMaintenance(
    userId: string,
    data: UpdateWindowMaintenanceDto
  ): Promise<WindowMaintenance> {
    try {
      const result = await this.pool.query(
        `UPDATE window_maintenance
         SET window_count = COALESCE($1, window_count),
             last_replacement_date = COALESCE($2, last_replacement_date),
             next_maintenance_date = COALESCE($3, next_maintenance_date),
             maintenance_notes = COALESCE($4, maintenance_notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5
         RETURNING *`,
        [
          data.windowCount,
          data.lastReplacementDate,
          data.nextMaintenanceDate,
          data.maintenanceNotes,
          userId
        ]
      );

      return result.rows[0];
    } catch (error) {
      appLogger.error('Error updating window maintenance:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        data
      });
      throw error;
    }
  }

  async getWeatherizationMonitoring(userId: string): Promise<WeatherizationMonitoring> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM weatherization_monitoring WHERE user_id = $1 ORDER BY inspection_date DESC LIMIT 1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default record if none exists
        const insertResult = await this.pool.query(
          `INSERT INTO weatherization_monitoring (
            user_id,
            inspection_date,
            condensation_issues,
            draft_locations
          )
          VALUES (
            $1,
            CURRENT_DATE,
            '{"locations": [], "severity": "none"}'::jsonb,
            '{"locations": [], "severity": "none"}'::jsonb
          )
          RETURNING *`,
          [userId]
        );
        return insertResult.rows[0];
      }

      return result.rows[0];
    } catch (error) {
      appLogger.error('Error fetching weatherization monitoring:', {
        error: error instanceof Error ? error.message : String(error),
        userId
      });
      throw error;
    }
  }

  async updateWeatherizationMonitoring(
    userId: string,
    data: UpdateWeatherizationDto
  ): Promise<WeatherizationMonitoring> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get the latest record
      const currentRecord = await client.query(
        'SELECT * FROM weatherization_monitoring WHERE user_id = $1 ORDER BY inspection_date DESC LIMIT 1',
        [userId]
      );

      // If inspection date is different, create new record
      if (data.inspectionDate && (!currentRecord.rows[0] || currentRecord.rows[0].inspection_date !== data.inspectionDate)) {
        const insertResult = await client.query(
          `INSERT INTO weatherization_monitoring (
            user_id,
            inspection_date,
            condensation_issues,
            draft_locations,
            notes
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *`,
          [
            userId,
            data.inspectionDate,
            JSON.stringify(data.condensationIssues || { locations: [], severity: 'none' }),
            JSON.stringify(data.draftLocations || { locations: [], severity: 'none' }),
            data.notes
          ]
        );

        await client.query('COMMIT');
        return insertResult.rows[0];
      }

      // Otherwise update existing record
      const updateResult = await client.query(
        `UPDATE weatherization_monitoring
         SET condensation_issues = COALESCE($1, condensation_issues),
             draft_locations = COALESCE($2, draft_locations),
             notes = COALESCE($3, notes),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $4 AND inspection_date = $5
         RETURNING *`,
        [
          data.condensationIssues ? JSON.stringify(data.condensationIssues) : null,
          data.draftLocations ? JSON.stringify(data.draftLocations) : null,
          data.notes,
          userId,
          currentRecord.rows[0].inspection_date
        ]
      );

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      appLogger.error('Error updating weatherization monitoring:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        data
      });
      throw error;
    } finally {
      client.release();
    }
  }
}

export const propertySettingsService = new PropertySettingsService(pool);
