/**
 * Enhanced Analytics Service with improved error handling and diagnostics
 * 
 * This version extends the base AnalyticsService with additional diagnostics
 * and more detailed error handling to help troubleshoot problems.
 */

import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';
import { appLogger, createLogMetadata } from '../utils/logger.js';
import util from 'util';

interface DiagnosticsResult {
  databaseConnection: boolean;
  tablesExist: {
    [key: string]: boolean;
  };
  counts: {
    [key: string]: number;
  };
  writeTest?: {
    success: boolean;
    message?: string;
    error?: string;
    code?: string;
    detail?: string;
  };
  errorDetails: Record<string, any> | null;
  overallError?: {
    message: string;
    stack?: string;
  };
  startTime: string;
  duration: number;
}

export class AnalyticsService {
  private pool: pkg.Pool;

  constructor(pool: pkg.Pool) {
    // Validate the pool object
    if (!pool || typeof pool.query !== 'function') {
      const errorMsg = 'Invalid database pool provided to AnalyticsService constructor';
      appLogger.error(errorMsg, createLogMetadata(undefined, { 
        poolType: typeof pool,
        hasQueryMethod: pool && typeof pool.query === 'function'
      }));
      throw new Error(errorMsg);
    }
    
    this.pool = pool;
    appLogger.info('Enhanced AnalyticsService initialized with database pool', createLogMetadata(undefined, {
      poolStatus: 'valid'
    }));
  }

  /**
   * Test database connection - useful for diagnostics
   */
  async testDatabaseConnection(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.pool.query('SELECT 1 AS connection_test');
      const duration = Date.now() - startTime;
      
      appLogger.info('Database connection test successful', createLogMetadata(undefined, {
        duration,
        result: result?.rows?.[0]?.connection_test === 1 ? 'success' : 'unexpected response'
      }));
      
      return true;
    } catch (error: any) {
      appLogger.error('Database connection test failed', createLogMetadata(undefined, {
        error: error.message || 'Unknown error',
        errorCode: error.code,
        errorDetail: error.detail,
        stack: error.stack
      }));
      
      throw error;
    }
  }

  /**
   * Run diagnostics on analytics storage
   * This is useful for admin dashboard to verify table status
   */
  async runDiagnostics(): Promise<DiagnosticsResult> {
    const diagnostics: DiagnosticsResult = {
      databaseConnection: false,
      tablesExist: {
        analytics_events: false,
        analytics_sessions: false,
        analytics_consent: false,
        pilot_tokens: false
      },
      counts: {
        events: 0,
        sessions: 0,
        consents: 0,
        tokens: 0
      },
      errorDetails: null,
      startTime: new Date().toISOString(),
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // Test database connection
      try {
        await this.testDatabaseConnection();
        diagnostics.databaseConnection = true;
      } catch (error: any) {
        diagnostics.errorDetails = {
          connection: {
            message: error.message,
            code: error.code,
            detail: error.detail
          }
        };
        // Return early if can't connect to database
        diagnostics.duration = Date.now() - startTime;
        return diagnostics;
      }
      
      // Check if tables exist and get counts
      try {
        const tableQueries = [
          { name: 'analytics_events', countColumn: 'id' },
          { name: 'analytics_sessions', countColumn: 'id' },
          { name: 'analytics_consent', countColumn: 'id' },
          { name: 'pilot_tokens', countColumn: 'id' }
        ];
        
        for (const table of tableQueries) {
          try {
            // Check if table exists
            const tableExistsQuery = `
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
              ) as exists
            `;
            
            const tableExists = await this.pool.query(tableExistsQuery, [table.name]);
            diagnostics.tablesExist[table.name] = tableExists.rows[0].exists;
            
            if (tableExists.rows[0].exists) {
              // Get count if table exists
              const countQuery = `SELECT COUNT(${table.countColumn}) as count FROM ${table.name}`;
              const countResult = await this.pool.query(countQuery);
              
              const countKey = table.name.replace('analytics_', '');
              diagnostics.counts[countKey] = parseInt(countResult.rows[0].count || '0');
            }
          } catch (tableError: any) {
            appLogger.error(`Error checking table ${table.name}`, createLogMetadata(undefined, {
              error: tableError.message,
              code: tableError.code
            }));
            
            if (!diagnostics.errorDetails) {
              diagnostics.errorDetails = {};
            }
            
            diagnostics.errorDetails[table.name] = {
              message: tableError.message,
              code: tableError.code
            };
          }
        }
      } catch (tablesError: any) {
        appLogger.error('Error checking database tables', createLogMetadata(undefined, {
          error: tablesError.message,
          code: tablesError.code
        }));
        
        if (!diagnostics.errorDetails) {
          diagnostics.errorDetails = {};
        }
        
        diagnostics.errorDetails.tables = {
          message: tablesError.message,
          code: tablesError.code,
          detail: tablesError.detail
        };
      }
      
      // Add basic query execution test
      try {
        const testSessionId = 'test-session-' + Date.now();
        const testUserId = 'test-user-' + Date.now();
        
        // Test session creation
        await this.pool.query(
          `INSERT INTO analytics_sessions (
            id, user_id, start_time, is_active, events_count, created_at, updated_at
          ) VALUES ($1, $2, NOW(), TRUE, 0, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING`,
          [testSessionId, testUserId]
        );
        
        // Delete the test data
        await this.pool.query('DELETE FROM analytics_sessions WHERE id = $1', [testSessionId]);
        
        diagnostics.writeTest = {
          success: true,
          message: 'Successfully inserted and deleted test data'
        };
      } catch (writeError: any) {
        appLogger.error('Error in write test', createLogMetadata(undefined, {
          error: writeError.message,
          code: writeError.code,
          detail: writeError.detail
        }));
        
        diagnostics.writeTest = {
          success: false,
          error: writeError.message,
          code: writeError.code,
          detail: writeError.detail
        };
      }
    } catch (error: any) {
      appLogger.error('Unexpected error in diagnostics', createLogMetadata(undefined, {
        error: error.message,
        stack: error.stack
      }));
      
      diagnostics.overallError = {
        message: error.message,
        stack: error.stack
      };
    }
    
    // Calculate duration
    diagnostics.duration = Date.now() - startTime;
    
    return diagnostics;
  }

  /**
   * Save analytics events to database with enhanced error handling and detailed diagnostics
   */
  async saveEvents(userId: string | null, sessionId: string, events: any[]): Promise<any> {
    const startTime = Date.now();
    try {
      // Validate input parameters with enhanced logging
      if (!sessionId) {
        appLogger.error('Missing sessionId in saveEvents', createLogMetadata(undefined, {
          userId: userId || 'anonymous'
        }));
        return { success: false, eventsProcessed: 0, error: 'Missing sessionId' };
      }
      
      if (!Array.isArray(events)) {
        appLogger.error('Events must be an array', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          eventsType: typeof events
        }));
        return { success: false, eventsProcessed: 0, error: 'Events must be an array' };
      }
      
      if (events.length === 0) {
        appLogger.info('No events to save, returning early', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous'
        }));
        return { success: true, eventsProcessed: 0 };
      }

      // Log the event details with enhanced details for debugging
      appLogger.info('Processing analytics events', createLogMetadata(undefined, {
        sessionId,
        userId: userId || 'anonymous',
        eventCount: events.length,
        eventTypes: events.map(e => e.eventType).join(', '),
        areas: [...new Set(events.map(e => e.area))].join(', '),
        sampleEvent: JSON.stringify(events[0])
      }));
      
      // Verify database connectivity before proceeding
      try {
        await this.testDatabaseConnection();
      } catch (dbError: any) {
        appLogger.error('Database connection test failed before saving events', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          error: dbError.message,
          errorDetails: util.inspect(dbError, { depth: 3 })
        }));
        return { 
          success: false, 
          eventsProcessed: 0, 
          error: 'Database connection error: ' + dbError.message 
        };
      }
      
      // Try to update or create the session record
      try {
        await this.updateSession(sessionId, userId);
        appLogger.debug('Session record updated successfully', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous'
        }));
      } catch (sessionError: any) {
        appLogger.error('Error updating session record', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          error: sessionError.message || 'Unknown error',
          errorDetails: util.inspect(sessionError, { depth: 3 }),
          stack: sessionError.stack
        }));
        // Continue anyway - we should still attempt to save events
      }

      // Process the events for insertion with enhanced error details
      appLogger.debug('Processing events for DB insertion', createLogMetadata(undefined, {
        sessionId,
        eventCount: events.length
      }));
      
      // Process events with more detailed validation
      const values = [];
      const invalidEvents = [];
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        try {
          // Enhanced validation
          if (!event.eventType) {
            invalidEvents.push({ event, reason: 'Missing eventType' });
            continue;
          }
          
          if (!event.area) {
            invalidEvents.push({ event, reason: 'Missing area' });
            continue;
          }
          
          if (!event.timestamp) {
            invalidEvents.push({ event, reason: 'Missing timestamp' });
            continue;
          }
          
          // Try to parse timestamp
          let timestamp;
          try {
            timestamp = new Date(event.timestamp);
            if (isNaN(timestamp.getTime())) {
              invalidEvents.push({ event, reason: 'Invalid timestamp format' });
              continue;
            }
          } catch (timeError: any) {
            invalidEvents.push({ event, reason: 'Could not parse timestamp: ' + timeError.message });
            continue;
          }
          
          // Ensure data field is properly handled
          let data = {};
          if (event.data) {
            if (typeof event.data === 'object') {
              data = event.data;
            } else {
              try {
                data = JSON.parse(event.data);
              } catch (parseError) {
                // If we can't parse, use as string
                data = { rawData: String(event.data) };
              }
            }
          }
          
          values.push({
            id: uuidv4(),
            sessionId: sessionId,
            userId: userId || null,
            eventType: event.eventType,
            area: event.area,
            timestamp: timestamp,
            data: data
          });
        } catch (eventParsingError: any) {
          appLogger.error('Error parsing event data', createLogMetadata(undefined, {
            sessionId,
            error: eventParsingError.message || 'Unknown error',
            eventIndex: i,
            eventData: JSON.stringify(event)
          }));
          invalidEvents.push({ event, reason: 'Parse error: ' + eventParsingError.message });
        }
      }
      
      // Log invalid events for debugging
      if (invalidEvents.length > 0) {
        appLogger.warn('Some events were invalid and will be skipped', createLogMetadata(undefined, {
          sessionId,
          invalidCount: invalidEvents.length,
          totalCount: events.length,
          sampleInvalid: invalidEvents.slice(0, 3)
        }));
      }

      // If no valid events, return early
      if (values.length === 0) {
        appLogger.info('No valid events to process after filtering', createLogMetadata(undefined, {
          sessionId,
          originalCount: events.length,
          invalidCount: invalidEvents.length
        }));
        return { 
          success: true, 
          eventsProcessed: 0,
          invalidEvents: invalidEvents.length
        };
      }

      // Build parameterized query for batch insert with detailed logging
      try {
        // Log the detailed query structure but not full SQL (could be too large)
        appLogger.debug('Building insert query', createLogMetadata(undefined, {
          sessionId,
          eventCount: values.length
        }));
        
        // Split inserts into batches of 100 max to prevent large query issues
        const batchSize = 100;
        let totalInserted = 0;
        
        // Perform inserts in batches
        for (let i = 0; i < values.length; i += batchSize) {
          const batch = values.slice(i, i + batchSize);
          
          const placeholders = batch.map((_, j) => {
            const base = j * 7;
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
          }).join(', ');

          const flatParams = batch.flatMap(v => [
            v.id,
            v.sessionId,
            v.userId,
            v.eventType,
            v.area,
            v.timestamp,
            JSON.stringify(v.data)
          ]);

          const query = `
            INSERT INTO analytics_events (id, session_id, user_id, event_type, area, timestamp, data)
            VALUES ${placeholders}
            RETURNING id
          `;

          appLogger.debug('Executing batch insert query', createLogMetadata(undefined, {
            sessionId,
            batchNumber: Math.floor(i / batchSize) + 1,
            batchSize: batch.length,
            totalBatches: Math.ceil(values.length / batchSize)
          }));
          
          const batchStart = Date.now();
          try {
            const result = await this.pool.query(query, flatParams);
            const batchInserted = result.rowCount || 0;
            totalInserted += batchInserted;
            
            appLogger.debug('Batch insert completed successfully', createLogMetadata(undefined, {
              sessionId,
              batchNumber: Math.floor(i / batchSize) + 1,
              batchInserted: batchInserted,
              batchDuration: Date.now() - batchStart
            }));
          } catch (batchError: any) {
            appLogger.error('Error in batch insert', createLogMetadata(undefined, {
              sessionId,
              batchNumber: Math.floor(i / batchSize) + 1,
              error: batchError.message,
              code: batchError.code,
              detail: batchError.detail,
              eventTypes: batch.map(v => v.eventType).join(',')
            }));
            
            // Continue with next batch instead of failing completely
          }
        }
        
        // Update the session with the new event count
        try {
          const updateSessionQuery = `
            UPDATE analytics_sessions
            SET events_count = events_count + $1, 
                updated_at = NOW()
            WHERE id = $2
          `;
          await this.pool.query(updateSessionQuery, [totalInserted, sessionId]);
          
          appLogger.debug('Updated session event count', createLogMetadata(undefined, {
            sessionId,
            addedCount: totalInserted
          }));
        } catch (updateSessionError: any) {
          appLogger.error('Error updating session event count', createLogMetadata(undefined, {
            sessionId,
            error: updateSessionError.message || 'Unknown error',
            stack: updateSessionError.stack
          }));
          // Continue anyway - this doesn't affect the success of event insertion
        }

        const totalDuration = Date.now() - startTime;
        appLogger.info('Analytics events saved successfully', createLogMetadata(undefined, {
          userId: userId || 'anonymous',
          sessionId,
          eventCount: values.length,
          insertedCount: totalInserted,
          invalidCount: invalidEvents.length,
          durationMs: totalDuration,
          eventsPerSecond: Math.round((totalInserted / totalDuration) * 1000)
        }));

        return { 
          success: true, 
          eventsProcessed: totalInserted,
          invalidEvents: invalidEvents.length,
          durationMs: totalDuration
        };
      } catch (insertError: any) {
        appLogger.error('Error executing insert query', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          error: insertError.message || 'Unknown error',
          code: insertError.code,
          detail: insertError.detail,
          stack: insertError.stack
        }));
        
        return { 
          success: false, 
          eventsProcessed: 0, 
          error: `Database error: ${insertError.message || 'Unknown error'}`,
          errorCode: insertError.code,
          detail: insertError.detail
        };
      }
    } catch (error: any) {
      const totalDuration = Date.now() - startTime;
      appLogger.error('Unhandled error in saveEvents', createLogMetadata(undefined, {
        userId: userId || 'anonymous',
        sessionId: sessionId || 'unknown',
        eventCount: events ? events.length : 0,
        error: error.message || 'Unknown error',
        stack: error.stack,
        durationMs: totalDuration,
        errorDetail: util.inspect(error, { depth: 3 })
      }));
      
      return { 
        success: false, 
        eventsProcessed: 0, 
        error: `Unhandled error: ${error.message || 'Unknown error'}`,
        errorDetail: error.name
      };
    }
  }

  /**
   * Update or create a session record with enhanced error handling
   */
  async updateSession(sessionId: string, userId: string | null): Promise<boolean> {
    try {
      if (!sessionId) {
        throw new Error('Missing sessionId parameter');
      }
      
      // Check if session exists
      const existingSession = await this.pool.query(
        'SELECT id FROM analytics_sessions WHERE id = $1',
        [sessionId]
      );

      if (existingSession.rowCount && existingSession.rowCount > 0) {
        // Update existing session
        await this.pool.query(
          'UPDATE analytics_sessions SET updated_at = NOW() WHERE id = $1',
          [sessionId]
        );
        
        appLogger.debug('Updated existing session', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous'
        }));
      } else {
        // Create new session
        await this.pool.query(
          `INSERT INTO analytics_sessions (
            id, user_id, start_time, is_active, events_count, created_at, updated_at
          ) VALUES ($1, $2, NOW(), TRUE, 0, NOW(), NOW())`,
          [sessionId, userId || null]
        );
        
        appLogger.info('Created new analytics session', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous'
        }));
      }
      
      return true;
    } catch (error: any) {
      appLogger.error('Error in updateSession', createLogMetadata(undefined, {
        sessionId,
        userId: userId || 'anonymous',
        error: error.message || 'Unknown error',
        errorDetail: util.inspect(error, { depth: 3 }),
        stack: error.stack
      }));
      
      throw error; // Re-throw to allow the caller to handle
    }
  }

  /**
   * End a session with enhanced error handling
   */
  async endSession(sessionId: string, duration: number): Promise<boolean> {
    try {
      if (!sessionId) {
        appLogger.error('Missing sessionId in endSession', createLogMetadata(undefined, {}));
        return false;
      }
      
      const query = `
        UPDATE analytics_sessions
        SET 
          is_active = FALSE, 
          end_time = NOW(), 
          duration = $1,
          updated_at = NOW()
        WHERE id = $2
      `;
      
      const result = await this.pool.query(query, [duration || 0, sessionId]);
      
      const rowsAffected = result.rowCount || 0;
      if (rowsAffected === 0) {
        appLogger.warn('No session found to end', createLogMetadata(undefined, {
          sessionId
        }));
      } else {
        appLogger.info('Successfully ended session', createLogMetadata(undefined, {
          sessionId,
          duration: duration || 0
        }));
      }
      
      return rowsAffected > 0;
    } catch (error: any) {
      appLogger.error('Error ending session', createLogMetadata(undefined, {
        sessionId,
        error: error.message || 'Unknown error',
        errorDetail: util.inspect(error, { depth: 3 }),
        stack: error.stack
      }));
      return false;
    }
  }

  /**
   * Get current consent status for a user with enhanced error handling
   */
  async getConsentStatus(userId: string): Promise<string> {
    try {
      if (!userId) {
        appLogger.error('Missing userId in getConsentStatus', createLogMetadata(undefined, {}));
        return 'not_asked';
      }
      
      const query = `
        SELECT status 
        FROM analytics_consent 
        WHERE user_id = $1 
        ORDER BY consent_date DESC 
        LIMIT 1
      `;
      
      const result = await this.pool.query(query, [userId]);
      
      if (result.rowCount === 0) {
        return 'not_asked';
      }
      
      return result.rows[0].status;
    } catch (error: any) {
      appLogger.error('Error getting consent status', createLogMetadata(undefined, {
        userId,
        error: error.message || 'Unknown error',
        errorDetail: util.inspect(error, { depth: 3 }),
        stack: error.stack
      }));
      return 'not_asked';
    }
  }

  /**
   * Update consent status for a user with enhanced error handling
   */
  async updateConsent(userId: string, status: string): Promise<boolean> {
    try {
      if (!userId) {
        appLogger.error('Missing userId in updateConsent', createLogMetadata(undefined, {
          status
        }));
        return false;
      }
      
      if (!['granted', 'denied', 'withdrawn'].includes(status)) {
        appLogger.error('Invalid consent status', createLogMetadata(undefined, {
          userId,
          status
        }));
        return false;
      }
      
      const consentId = uuidv4();
      const consentVersion = '1.0'; // Update this when consent text changes
      
      const query = `
        INSERT INTO analytics_consent (
          id, user_id, status, consent_date, consent_version, 
          data_usage_accepted, created_at, updated_at
        ) 
        VALUES ($1, $2, $3, NOW(), $4, $5, NOW(), NOW())
      `;
      
      await this.pool.query(query, [
        consentId, 
        userId, 
        status, 
        consentVersion,
        status === 'granted'
      ]);
      
      appLogger.info('Updated consent status', createLogMetadata(undefined, {
        userId,
        status,
        consentVersion
      }));
      
      return true;
    } catch (error: any) {
      appLogger.error('Error updating consent status', createLogMetadata(undefined, {
        userId,
        status,
        error: error.message || 'Unknown error',
        errorDetail: util.inspect(error, { depth: 3 }),
        stack: error.stack
      }));
      return false;
    }
  }

  /**
   * Validate a pilot study invitation token with enhanced error handling
   */
  async validatePilotToken(token: string): Promise<any> {
    try {
      if (!token) {
        appLogger.error('Missing token in validatePilotToken', createLogMetadata(undefined, {}));
        return {
          valid: false,
          message: 'Token is required'
        };
      }
      
      // Query the pilot_tokens table
      const result = await this.pool.query(
        'SELECT token, participant_type, used_at FROM pilot_tokens WHERE token = $1',
        [token]
      );
      
      // If token doesn't exist
      if (result.rowCount === 0) {
        return {
          valid: false,
          message: 'Invalid token'
        };
      }
      
      // If token has already been used
      if (result.rows[0].used_at) {
        return {
          valid: false,
          message: 'Token has already been used'
        };
      }
      
      const participantType = result.rows[0].participant_type;
      
      return {
        valid: true,
        participantType
      };
    } catch (error: any) {
      appLogger.error('Error validating pilot token', createLogMetadata(undefined, {
        token,
        error: error.message || 'Unknown error',
        errorDetail: util.inspect(error, { depth: 3 }),
        stack: error.stack
      }));
      
      return {
        valid: false,
        message: 'Error processing token'
      };
    }
  }

  /**
   * Register a pilot study participant with enhanced error handling
   */
  async registerPilotParticipant(email: string, password: string, token: string, participantType: string): Promise<any> {
    try {
      // Validate input parameters
      if (!email || !password || !token || !participantType) {
        appLogger.error('Missing required fields in registerPilotParticipant', createLogMetadata(undefined, {
          hasEmail: !!email,
          hasPassword: !!password,
          hasToken: !!token,
          hasParticipantType: !!participantType
        }));
        
        return {
          success: false,
          message: 'Missing required fields'
        };
      }
      
      // In a real implementation, we would:
      // 1. Register the user in the auth system
      // 2. Set a pilot study flag in their profile
      // 3. Store the participant type
      // 4. Return the auth token
      
      // For now, we'll simulate success with a fake user ID
      const userId = uuidv4();
      const authToken = uuidv4(); // In real impl, this would be a JWT
      
      try {
        // Automatically set analytics consent for pilot participants
        await this.updateConsent(userId, 'granted');
      } catch (consentError: any) {
        appLogger.error('Error setting initial consent for pilot participant', createLogMetadata(undefined, {
          userId,
          error: consentError.message || 'Unknown error',
          errorDetail: util.inspect(consentError, { depth: 3 })
        }));
        // Continue anyway - this is not critical
      }
      
      // Log the registration event
      appLogger.info('Pilot participant registered', createLogMetadata(undefined, {
        userId,
        participantType,
        email
      }));
      
      return {
        success: true,
        userId,
        token: authToken
      };
    } catch (error: any) {
      appLogger.error('Error registering pilot participant', createLogMetadata(undefined, {
        email,
        token,
        participantType,
        error: error.message || 'Unknown error',
        errorDetail: util.inspect(error, { depth: 3 }),
        stack: error.stack
      }));
      
      return {
        success: false,
        message: 'Error processing registration'
      };
    }
  }

  /**
   * Get analytics metrics for pilot study dashboard with enhanced error handling
   */
  async getMetrics(request: any): Promise<any> {
    // Log the raw request for debugging
    appLogger.info('Getting analytics metrics raw request', createLogMetadata(undefined, {
      rawRequest: request
    }));

    try {
      if (!request) {
        throw new Error('Missing request object');
      }
      
      const { startDate, endDate, filters } = request;
      
      // Ensure we have valid dates - additional safety checks
      let dateStart, dateEnd;
      try {
        // Use a default if no startDate or if it's invalid
        if (!startDate || startDate.trim() === '') {
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() - 30); // Default to last 30 days
          dateStart = defaultDate;
          appLogger.info('Using default start date', createLogMetadata(undefined, {
            defaultDate: dateStart.toISOString()
          }));
        } else {
          dateStart = new Date(startDate);
          // Check if valid date
          if (isNaN(dateStart.getTime())) {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() - 30);
            dateStart = defaultDate;
            appLogger.warn('Invalid start date provided, using default', createLogMetadata(undefined, {
              providedStartDate: startDate,
              defaultDate
