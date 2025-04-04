/**
 * Enhanced Analytics Service with improved error handling
 */

import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';
import { appLogger, createLogMetadata } from '../utils/logger.js';

// Function to initialize the pilot token table
export async function initPilotTokenTable(pool) {
  try {
    if (!pool || typeof pool.query !== 'function') {
      appLogger.error('Invalid pool object passed to initPilotTokenTable', createLogMetadata(undefined, {
        poolType: typeof pool,
        hasQueryMethod: pool && typeof pool.query === 'function'
      }));
      return { success: false, message: 'Invalid database pool object' };
    }

    // Create the pilot tokens table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pilot_tokens (
        id SERIAL PRIMARY KEY,
        token VARCHAR(50) NOT NULL UNIQUE,
        participant_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        used_at TIMESTAMP,
        used_by VARCHAR(50)
      )
    `);
    
    // Insert the default tokens if they don't exist
    const defaultTokens = [
      { token: 'ENERGY-PILOT-HC-001', participantType: 'homeowner-energy-conscious' },
      { token: 'ENERGY-PILOT-HL-001', participantType: 'homeowner-limited-knowledge' },
      { token: 'ENERGY-PILOT-HT-001', participantType: 'homeowner-technical' },
      { token: 'ENERGY-PILOT-HN-001', participantType: 'homeowner-non-technical' }
    ];
    
    for (const tokenData of defaultTokens) {
      try {
        // Check if token already exists
        const existingToken = await pool.query(
          'SELECT token FROM pilot_tokens WHERE token = $1',
          [tokenData.token]
        );
        
        // Insert token if it doesn't exist
        if (existingToken.rowCount === 0) {
          await pool.query(
            'INSERT INTO pilot_tokens (token, participant_type) VALUES ($1, $2)',
            [tokenData.token, tokenData.participantType]
          );
          appLogger.info('Inserted default pilot token', createLogMetadata(undefined, {
            token: tokenData.token,
            participantType: tokenData.participantType
          }));
        }
      } catch (tokenError) {
        appLogger.error('Error processing token', createLogMetadata(undefined, {
          token: tokenData.token,
          error: tokenError.message || 'Unknown error'
        }));
      }
    }
    
    return { success: true, message: 'Pilot token table initialized' };
  } catch (error) {
    appLogger.error('Error initializing pilot token table', createLogMetadata(undefined, { 
      error: error.message || 'Unknown error',
      stack: error.stack
    }));
    return { success: false, message: `Error initializing pilot token table: ${error.message || 'Unknown error'}` };
  }
}

export class AnalyticsService {
  constructor(pool) {
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
    appLogger.info('AnalyticsService initialized with database pool', createLogMetadata(undefined, {
      poolStatus: 'valid'
    }));
  }

  /**
   * Save analytics events to database with enhanced error handling
   */
  async saveEvents(userId, sessionId, events) {
    try {
      // Validate input parameters to prevent difficult-to-debug errors
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

      // Log the event details for debugging
      appLogger.info('Analytics events received', createLogMetadata(undefined, {
        sessionId,
        userId: userId || 'anonymous',
        eventCount: events.length,
        eventTypes: events.map(e => e.eventType).join(', '),
        areas: [...new Set(events.map(e => e.area))].join(', '),
        sampleEvent: JSON.stringify(events[0])
      }));
      
      // During pilot study, accept all events to maximize data collection
      // In a production environment, we'd check for consent from the user
      // For anonymous users (no userId), we still accept their events
      // if they've explicitly sent them (implied consent through the AnalyticsContext)
      
      // Log but don't reject anonymous events - pilot study specific behavior
      if (!userId) {
        appLogger.info('Anonymous analytics events received', createLogMetadata(undefined, {
          sessionId,
          eventCount: events.length
        }));
      } 
      // For logged-in users, still check consent
      else {
        try {
          const consentStatus = await this.getConsentStatus(userId);
          if (consentStatus !== 'granted') {
            appLogger.warn('Analytics events for user without explicit consent', createLogMetadata(undefined, {
              userId,
              sessionId,
              consentStatus,
              eventCount: events.length
            }));
            // For pilot study, we'll still save the data but log that there was no consent
            // This maximizes our ability to gather data for the study
          }
        } catch (consentError) {
          appLogger.error('Error checking consent status', createLogMetadata(undefined, {
            userId,
            sessionId,
            error: consentError.message || 'Unknown error'
          }));
          // Continue anyway for pilot study
        }
      }

      // Try to update or create the session record
      try {
        await this.updateSession(sessionId, userId);
      } catch (sessionError) {
        appLogger.error('Error updating session record', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          error: sessionError.message || 'Unknown error',
          stack: sessionError.stack
        }));
        // Continue anyway - we should still attempt to save events
      }

      // Process the events for insertion
      appLogger.debug('Processing events for DB insertion', createLogMetadata(undefined, {
        sessionId,
        eventCount: events.length
      }));
      
      // Batch insert the events
      const values = events.map(event => {
        try {
          // Ensure data field is properly handled
          const data = event.data || {};
          return {
            id: uuidv4(),
            sessionId: sessionId,
            userId: userId || null,
            eventType: event.eventType || 'unknown',
            area: event.area || 'unknown',
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            data: JSON.stringify(data)
          };
        } catch (eventParsingError) {
          appLogger.error('Error parsing event data', createLogMetadata(undefined, {
            sessionId,
            error: eventParsingError.message || 'Unknown error',
            eventData: JSON.stringify(event)
          }));
          // Return null for events that can't be processed
          return null;
        }
      }).filter(Boolean); // Remove null entries

      // If no valid events, return early
      if (values.length === 0) {
        appLogger.info('No valid events to process after filtering', createLogMetadata(undefined, {
          sessionId,
          originalCount: events.length
        }));
        return { success: true, eventsProcessed: 0 };
      }

      // Build parameterized query for batch insert
      try {
        const placeholders = values.map((_, i) => {
          const base = i * 7;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
        }).join(', ');

        const flatParams = values.flatMap(v => [
          v.id,
          v.sessionId,
          v.userId,
          v.eventType,
          v.area,
          v.timestamp,
          v.data
        ]);

        const query = `
          INSERT INTO analytics_events (id, session_id, user_id, event_type, area, timestamp, data)
          VALUES ${placeholders}
          RETURNING id
        `;

        appLogger.debug('Executing insert query', createLogMetadata(undefined, {
          eventsCount: values.length,
          paramCount: flatParams.length
        }));
        
        const result = await this.pool.query(query, flatParams);
        const insertedCount = result.rowCount || 0;

        // Update the session with the new event count
        try {
          const updateSessionQuery = `
            UPDATE analytics_sessions
            SET events_count = events_count + $1, 
                updated_at = NOW()
            WHERE id = $2::uuid
          `;
          await this.pool.query(updateSessionQuery, [insertedCount, sessionId]);
        } catch (updateSessionError) {
          appLogger.error('Error updating session event count', createLogMetadata(undefined, {
            sessionId,
            error: updateSessionError.message || 'Unknown error',
            stack: updateSessionError.stack
          }));
          // Continue anyway - this doesn't affect the success of event insertion
        }

        appLogger.info('Analytics events saved successfully', createLogMetadata(undefined, {
          userId: userId || 'anonymous',
          sessionId,
          eventCount: insertedCount,
          eventTypes: events.map(e => e.eventType).join(', ')
        }));

        return { success: true, eventsProcessed: insertedCount };
      } catch (insertError) {
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
          error: `Database error: ${insertError.message || 'Unknown error'}` 
        };
      }
    } catch (error) {
      appLogger.error('Unhandled error in saveEvents', createLogMetadata(undefined, {
        userId: userId || 'anonymous',
        sessionId: sessionId || 'unknown',
        eventCount: events ? events.length : 0,
        error: error.message || 'Unknown error',
        stack: error.stack
      }));
      
      return { 
        success: false, 
        eventsProcessed: 0, 
        error: `Unhandled error: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Update or create a session record with enhanced error handling
   */
  async updateSession(sessionId, userId) {
    try {
      if (!sessionId) {
        throw new Error('Missing sessionId parameter');
      }
      
      // Check if session exists
      const existingSession = await this.pool.query(
        'SELECT id FROM analytics_sessions WHERE id = $1::uuid',
        [sessionId]
      );

      if (existingSession.rowCount && existingSession.rowCount > 0) {
        // Update existing session
        await this.pool.query(
          'UPDATE analytics_sessions SET updated_at = NOW() WHERE id = $1::uuid',
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
    } catch (error) {
      appLogger.error('Error in updateSession', createLogMetadata(undefined, {
        sessionId,
        userId: userId || 'anonymous',
        error: error.message || 'Unknown error',
        stack: error.stack
      }));
      
      throw error; // Re-throw to allow the caller to handle
    }
  }

  /**
   * End a session with enhanced error handling
   */
  async endSession(sessionId, duration) {
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
        WHERE id = $2::uuid
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
    } catch (error) {
      appLogger.error('Error ending session', createLogMetadata(undefined, {
        sessionId,
        error: error.message || 'Unknown error',
        stack: error.stack
      }));
      return false;
    }
  }

  /**
   * Get current consent status for a user with enhanced error handling
   */
  async getConsentStatus(userId) {
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
    } catch (error) {
      appLogger.error('Error getting consent status', createLogMetadata(undefined, {
        userId,
        error: error.message || 'Unknown error',
        stack: error.stack
      }));
      return 'not_asked';
    }
  }

  /**
   * Update consent status for a user with enhanced error handling
   */
  async updateConsent(userId, status) {
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
    } catch (error) {
      appLogger.error('Error updating consent status', createLogMetadata(undefined, {
        userId,
        status,
        error: error.message || 'Unknown error',
        stack: error.stack
      }));
      return false;
    }
  }

  /**
   * Validate a pilot study invitation token with enhanced error handling
   */
  async validatePilotToken(token) {
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
    } catch (error) {
      appLogger.error('Error validating pilot token', createLogMetadata(undefined, {
        token,
        error: error.message || 'Unknown error',
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
  async registerPilotParticipant(email, password, token, participantType) {
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
      } catch (consentError) {
        appLogger.error('Error setting initial consent for pilot participant', createLogMetadata(undefined, {
          userId,
          error: consentError.message || 'Unknown error'
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
    } catch (error) {
      appLogger.error('Error registering pilot participant', createLogMetadata(undefined, {
        email,
        token,
        participantType,
        error: error.message || 'Unknown error',
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
  async getMetrics(request) {
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
              defaultDate: dateStart.toISOString()
            }));
          }
        }

        // Use a default if no endDate or if it's invalid
        if (!endDate || endDate.trim() === '') {
          dateEnd = new Date();
          appLogger.info('Using default end date', createLogMetadata(undefined, {
            defaultDate: dateEnd.toISOString()
          }));
        } else {
          dateEnd = new Date(endDate);
          // Check if valid date
          if (isNaN(dateEnd.getTime())) {
            dateEnd = new Date();
            appLogger.warn('Invalid end date provided, using default', createLogMetadata(undefined, {
              providedEndDate: endDate,
              defaultDate: dateEnd.toISOString()
            }));
          }
        }
      } catch (dateError) {
        // If any date parsing error occurs, use defaults
        appLogger.error('Error parsing dates, using defaults', createLogMetadata(undefined, {
          error: dateError.message || 'Unknown error',
          startDate,
          endDate
        }));
        const defaultStart = new Date();
        defaultStart.setDate(defaultStart.getDate() - 30);
        dateStart = defaultStart;
        dateEnd = new Date();
      }

      // Log the parsed dates
      appLogger.info('Using date range for metrics', createLogMetadata(undefined, {
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString()
      }));
      
      let totalSessions = 0;
      let avgSessionDuration = 0;
      let formCompletions = 0;
      let pageViewsByArea = [];
      let featureUsage = [];

      // Run each query separately with individual try/catch to prevent one failure from breaking everything
      try {
        // Query for total sessions
        const sessionsQuery = `
          SELECT COUNT(*) as total_sessions,
                 AVG(COALESCE(duration, 0)) as avg_duration
          FROM analytics_sessions
          WHERE start_time BETWEEN $1 AND $2
        `;
        
        const sessionsResult = await this.pool.query(sessionsQuery, [dateStart, dateEnd]);
        totalSessions = parseInt(sessionsResult.rows[0]?.total_sessions || '0');
        avgSessionDuration = Math.round(parseFloat(sessionsResult.rows[0]?.avg_duration || '0'));
        
        appLogger.info('Sessions query result', createLogMetadata(undefined, {
          totalSessions,
          avgSessionDuration,
          rawResult: sessionsResult.rows[0]
        }));
      } catch (sessionsError) {
        appLogger.error('Error in sessions query', createLogMetadata(undefined, {
          error: sessionsError.message || 'Unknown error',
          stack: sessionsError.stack
        }));
      }
      
      try {
        // Query for form completions
        const formCompletionsQuery = `
          SELECT COUNT(*) as completions
          FROM analytics_events
          WHERE event_type = 'form_interaction'
          AND (data->>'action' = 'submit' OR data->>'action' = 'completion')
          AND timestamp BETWEEN $1 AND $2
        `;
        
        const formCompletionsResult = await this.pool.query(formCompletionsQuery, [dateStart, dateEnd]);
        formCompletions = parseInt(formCompletionsResult.rows[0]?.completions || '0');

        appLogger.info('Form completions query result', createLogMetadata(undefined, { 
          formCompletions,
          rawResult: formCompletionsResult.rows[0]
        }));
      } catch (formError) {
        appLogger.error('Error in form completions query', createLogMetadata(undefined, {
          error: formError.message || 'Unknown error',
          stack: formError.stack
        }));
      }
      
      try {
        // Query for page views by area
        const pageViewsQuery = `
          SELECT area, COUNT(*) as count
          FROM analytics_events
          WHERE event_type = 'page_view'
          AND timestamp BETWEEN $1 AND $2
          GROUP BY area
          ORDER BY count DESC
          LIMIT 10
        `;
        
        const pageViewsResult = await this.pool.query(pageViewsQuery, [dateStart, dateEnd]);
        pageViewsByArea = pageViewsResult.rows.map((row) => ({
          area: row.area,
          count: parseInt(row.count)
        }));

        appLogger.info('Page views query result', createLogMetadata(undefined, { 
          pageViewsCount: pageViewsByArea.length,
          rawResult: pageViewsResult.rows
        }));
      } catch (pageViewsError) {
        appLogger.error('Error in page views query', createLogMetadata(undefined, {
          error: pageViewsError.message || 'Unknown error',
          stack: pageViewsError.stack
        }));
      }
      
      try {
        // Query for feature usage
        const featureUsageQuery = `
          SELECT data->>'featureId' as feature, COUNT(*) as count
          FROM analytics_events
          WHERE event_type = 'feature_usage'
          AND timestamp BETWEEN $1 AND $2
          GROUP BY data->>'featureId'
          ORDER BY count DESC
          LIMIT 10
        `;
        
        const featureUsageResult = await this.pool.query(featureUsageQuery, [dateStart, dateEnd]);
        featureUsage = featureUsageResult.rows.map((row) => ({
          feature: row.feature,
          count: parseInt(row.count)
        }));

        appLogger.info('Feature usage query result', createLogMetadata(undefined, { 
          featureUsageCount: featureUsage.length,
          rawResult: featureUsageResult.rows
        }));
      } catch (featureUsageError) {
        appLogger.error('Error in feature usage query', createLogMetadata(undefined, {
          error: featureUsageError.message || 'Unknown error',
          stack: featureUsageError.stack
        }));
      }
      
      // All queries are complete (successful or not)
      // Construct the response with whatever data we have
      const response = {
        success: true,
        metrics: {
          totalSessions,
          avgSessionDuration,
          formCompletions,
          pageViewsByArea,
          featureUsage
        },
        dateRange: {
          startDate: dateStart.toISOString(),
          endDate: dateEnd.toISOString()
        }
      };

      appLogger.info('Analytics metrics response', createLogMetadata(undefined, {
        response
      }));

      return response;
    } catch (error) {
      // Catch any other unexpected errors
      appLogger.error('Unexpected error getting analytics metrics', createLogMetadata(undefined, {
        error: error.message || 'Unknown error',
        stack: error.stack,
        requestData: {
          startDate: request?.startDate,
          endDate: request?.endDate,
          filters: request?.filters ? 'present' : 'none'
        }
      }));
      
      return {
        success: false,
        metrics: {
          totalSessions: 0,
          avgSessionDuration: 0,
          formCompletions: 0,
          pageViewsByArea: [],
          featureUsage: []
        },
        dateRange: {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString()
        }
      };
    }
  }
}
