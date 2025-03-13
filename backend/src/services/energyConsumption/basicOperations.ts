import { pool } from '../../config/database.js';
import { appLogger } from '../../utils/logger.js';
import { EnergyConsumptionRecord } from '../../types/energyConsumption.js';

/**
 * Add a new energy consumption record
 * @param record The energy consumption record to add
 * @returns The added record
 */
export async function addRecord(record: EnergyConsumptionRecord): Promise<EnergyConsumptionRecord> {
  try {
    const query = `
      INSERT INTO energy_consumption_records (
        user_id, property_id, record_date, 
        electricity_usage, gas_usage, water_usage,
        electricity_cost, gas_cost, water_cost,
        heating_degree_days, cooling_degree_days, weather_data
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;

    const params = [
      record.user_id,
      record.property_id || null,
      record.record_date,
      record.electricity_usage || null,
      record.gas_usage || null,
      record.water_usage || null,
      record.electricity_cost || null,
      record.gas_cost || null,
      record.water_cost || null,
      record.heating_degree_days || null,
      record.cooling_degree_days || null,
      record.weather_data ? JSON.stringify(record.weather_data) : null
    ];

    const result = await pool.query(query, params);
    appLogger.info(`Added energy consumption record for user ${record.user_id} on ${record.record_date}`);
    
    return result.rows[0];
  } catch (error) {
    appLogger.error('Error adding energy consumption record:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId: record.user_id,
      recordDate: record.record_date
    });
    throw new Error(`Failed to add energy consumption record: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get energy consumption records for a user
 * @param userId The user ID
 * @param startDate Optional start date filter
 * @param endDate Optional end date filter
 * @param propertyId Optional property ID filter
 * @returns Array of energy consumption records
 */
export async function getRecords(
  userId: string, 
  startDate?: Date, 
  endDate?: Date, 
  propertyId?: string
): Promise<EnergyConsumptionRecord[]> {
  try {
    let query = `
      SELECT * FROM energy_consumption_records
      WHERE user_id = $1
    `;
    
    const params: any[] = [userId];
    
    if (startDate) {
      query += ` AND record_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND record_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    if (propertyId) {
      query += ` AND property_id = $${params.length + 1}`;
      params.push(propertyId);
    }
    
    query += ` ORDER BY record_date DESC`;
    
    const result = await pool.query(query, params);
    appLogger.debug(`Retrieved ${result.rows.length} energy consumption records for user ${userId}`);
    
    return result.rows;
  } catch (error) {
    appLogger.error('Error retrieving energy consumption records:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      userId,
      startDate,
      endDate,
      propertyId
    });
    throw new Error(`Failed to retrieve energy consumption records: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update an energy consumption record
 * @param recordId The record ID
 * @param userId The user ID (for validation)
 * @param updates The updates to apply
 * @returns The updated record
 */
export async function updateRecord(
  recordId: string, 
  userId: string, 
  updates: Partial<EnergyConsumptionRecord>
): Promise<EnergyConsumptionRecord> {
  try {
    // Start building the query
    let query = 'UPDATE energy_consumption_records SET ';
    const params: any[] = [];
    const updateFields: string[] = [];
    
    // Add fields that can be updated
    if (updates.property_id !== undefined) {
      params.push(updates.property_id);
      updateFields.push(`property_id = $${params.length}`);
    }
    
    if (updates.record_date !== undefined) {
      params.push(updates.record_date);
      updateFields.push(`record_date = $${params.length}`);
    }
    
    if (updates.electricity_usage !== undefined) {
      params.push(updates.electricity_usage);
      updateFields.push(`electricity_usage = $${params.length}`);
    }
    
    if (updates.gas_usage !== undefined) {
      params.push(updates.gas_usage);
      updateFields.push(`gas_usage = $${params.length}`);
    }
    
    if (updates.water_usage !== undefined) {
      params.push(updates.water_usage);
      updateFields.push(`water_usage = $${params.length}`);
    }
    
    if (updates.electricity_cost !== undefined) {
      params.push(updates.electricity_cost);
      updateFields.push(`electricity_cost = $${params.length}`);
    }
    
    if (updates.gas_cost !== undefined) {
      params.push(updates.gas_cost);
      updateFields.push(`gas_cost = $${params.length}`);
    }
    
    if (updates.water_cost !== undefined) {
      params.push(updates.water_cost);
      updateFields.push(`water_cost = $${params.length}`);
    }
    
    if (updates.heating_degree_days !== undefined) {
      params.push(updates.heating_degree_days);
      updateFields.push(`heating_degree_days = $${params.length}`);
    }
    
    if (updates.cooling_degree_days !== undefined) {
      params.push(updates.cooling_degree_days);
      updateFields.push(`cooling_degree_days = $${params.length}`);
    }
    
    if (updates.weather_data !== undefined) {
      params.push(JSON.stringify(updates.weather_data));
      updateFields.push(`weather_data = $${params.length}`);
    }
    
    // If no updates provided, return early
    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Complete the query
    query += updateFields.join(', ');
    query += ` WHERE id = $${params.length + 1} AND user_id = $${params.length + 2} RETURNING *`;
    
    // Add record ID and user ID
    params.push(recordId);
    params.push(userId);
    
    // Execute the query
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      throw new Error('Record not found or user does not have permission');
    }
    
    appLogger.info(`Updated energy consumption record ${recordId} for user ${userId}`);
    
    return result.rows[0];
  } catch (error) {
    appLogger.error('Error updating energy consumption record:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      recordId,
      userId
    });
    throw new Error(`Failed to update energy consumption record: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Delete an energy consumption record
 * @param recordId The record ID
 * @param userId The user ID (for validation)
 * @returns True if deleted, false if not found
 */
export async function deleteRecord(recordId: string, userId: string): Promise<boolean> {
  try {
    const query = `
      DELETE FROM energy_consumption_records
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await pool.query(query, [recordId, userId]);
    
    const deleted = result.rowCount > 0;
    
    if (deleted) {
      appLogger.info(`Deleted energy consumption record ${recordId} for user ${userId}`);
    } else {
      appLogger.warn(`Attempted to delete non-existent record ${recordId} for user ${userId}`);
    }
    
    return deleted;
  } catch (error) {
    appLogger.error('Error deleting energy consumption record:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      recordId,
      userId
    });
    throw new Error(`Failed to delete energy consumption record: ${error instanceof Error ? error.message : String(error)}`);
  }
}
