import pkg from 'pg';
const { Pool } = pkg;
import { appLogger, createLogMetadata } from '../utils/logger.js';

// Create specific error class for audit history related errors
class AuditHistoryError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'AuditHistoryError';
    this.statusCode = statusCode;
  }
}

/**
 * Service specifically for audit history functionality
 * This is a simplified version of functionality from EnergyAuditService
 * focused only on retrieving audit history with better error handling
 */
export class AuditHistoryService {
  private pool: any;
  
  constructor(pool: any) {
    if (!pool) {
      throw new Error('Database pool is required for AuditHistoryService');
    }
    this.pool = pool;
  }
  
  /**
   * Get simplified paginated audit history for a user
   * This method uses a much simpler query than the EnergyAuditService version
   * and has more robust error handling
   */
  async getAuditHistory(userId: string, page: number = 1, limit: number = 5): Promise<{
    audits: {
      id: string;
      date: string;
      address: string;
      recommendations: number;
      title: string;
    }[];
    pagination: {
      totalRecords: number;
      totalPages: number;
      currentPage: number;
      limit: number;
    };
  }> {
    // Input validation
    if (!userId) {
      throw new AuditHistoryError('User ID is required', 400);
    }
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 5;
    if (limit > 50) limit = 50;
    
    const offset = (page - 1) * limit;
    
    // Log connection attempt
    appLogger.debug('Attempting database connection for audit history', {
      userId: userId.substring(0, 8) + '...',
      page,
      limit,
      offset
    });
    
    let client = null;
    try {
      // Get a client from the connection pool
      client = await this.pool.connect();
      appLogger.debug('Database connection successful');
      
      // Get count with a simplified query - just count the rows
      const countQuery = 'SELECT COUNT(*) FROM energy_audits WHERE user_id = $1';
      const countResult = await client.query(countQuery, [userId]);
      
      // Check if count query returned valid results
      if (!countResult || !countResult.rows || countResult.rows.length === 0) {
        return {
          audits: [],
          pagination: {
            totalRecords: 0,
            totalPages: 0,
            currentPage: page,
            limit
          }
        };
      }
      
      const totalRecords = parseInt(countResult.rows[0]?.count || '0');
      const totalPages = Math.ceil(totalRecords / limit) || 1;
      
      // If no records, return empty result
      if (totalRecords === 0) {
        return {
          audits: [],
          pagination: {
            totalRecords: 0,
            totalPages: 0,
            currentPage: page,
            limit
          }
        };
      }
      
      // Main query - simplified and defensive
      // Note: We avoid complex subqueries and JOIN operations to reduce possible errors
      const mainQuery = `
        SELECT 
          id,
          created_at,
          basic_info
        FROM 
          energy_audits
        WHERE 
          user_id = $1
        ORDER BY 
          created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await client.query(mainQuery, [userId, limit, offset]);
      
      // Process the results with defensive programming
      const audits = (result.rows || []).map((row: any) => {
        try {
          const id = row.id || '';
          const date = row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString();
          
          // Default values
          let title = 'Energy Audit';
          let address = 'No address provided';
          
          // Process basic_info which may be a JSON string or an object
          let basicInfo = null;
          try {
            if (typeof row.basic_info === 'string') {
              basicInfo = JSON.parse(row.basic_info);
            } else if (typeof row.basic_info === 'object' && row.basic_info !== null) {
              basicInfo = row.basic_info;
            }
          } catch (e) {
            appLogger.error('Failed to parse basic_info JSON', {
              error: e instanceof Error ? e.message : 'Unknown error',
              basicInfo: typeof row.basic_info === 'string' ? row.basic_info.substring(0, 100) + '...' : typeof row.basic_info
            });
          }
          
          // Extract title and address with fallbacks at each step
          if (basicInfo) {
            title = basicInfo.propertyName || basicInfo.property_name || 'Energy Audit';
            address = basicInfo.address || basicInfo.propertyAddress || basicInfo.property_address || 'No address provided';
          }
          
          // Fetch recommendations count in a separate query for reliability
          return {
            id,
            date,
            address: address.toString(),
            recommendations: 0, // Will be updated with actual count
            title
          };
        } catch (error) {
          appLogger.error('Error processing audit row', {
            error: error instanceof Error ? error.message : 'Unknown error',
            row: JSON.stringify(row).substring(0, 100) + '...'
          });
          
          // Return a default object if processing fails
          return {
            id: row.id || '',
            date: new Date().toISOString(),
            address: 'Error processing address',
            recommendations: 0,
            title: 'Energy Audit'
          };
        }
      });
      
      // Define the audit type for type safety
      interface AuditEntry {
        id: string;
        date: string;
        address: string;
        recommendations: number;
        title: string;
      }
      
      // For each audit, get recommendations count in a separate query
      // This is more reliable than complex subqueries or JOINs
      const auditIds = audits.map((audit: AuditEntry) => audit.id);
      
      if (auditIds.length > 0) {
        try {
          const recsQuery = `
            SELECT 
              audit_id, 
              COUNT(*) as rec_count
            FROM 
              audit_recommendations
            WHERE 
              audit_id = ANY($1::uuid[])
            GROUP BY 
              audit_id
          `;
          
          const recsResult = await client.query(recsQuery, [auditIds]);
          
          // Update audits with recommendation counts
          if (recsResult && recsResult.rows) {
            for (const recRow of recsResult.rows) {
              const auditToUpdate = audits.find((a: AuditEntry) => a.id === recRow.audit_id);
              if (auditToUpdate) {
                auditToUpdate.recommendations = parseInt(recRow.rec_count) || 0;
              }
            }
          }
        } catch (recError) {
          // Log recommendation count error but don't fail the entire request
          appLogger.error('Error fetching recommendation counts', {
            error: recError instanceof Error ? recError.message : 'Unknown error',
            auditIds
          });
        }
      }
      
      return {
        audits,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: page,
          limit
        }
      };
      
    } catch (error) {
      appLogger.error('Database error in getAuditHistory', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        userId: userId.substring(0, 8) + '...',
        page,
        limit
      });
      
      // Throw a more specific error
      throw new AuditHistoryError(
        `Failed to retrieve audit history: ${error instanceof Error ? error.message : 'Unknown database error'}`,
        500
      );
    } finally {
      // Make sure we always release the client back to the pool
      if (client) {
        try {
          client.release();
          appLogger.debug('Database client released');
        } catch (releaseError) {
          appLogger.error('Error releasing database client', {
            error: releaseError instanceof Error ? releaseError.message : 'Unknown error'
          });
        }
      }
    }
  }
}
