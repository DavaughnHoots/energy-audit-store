/**
 * Enhanced Analytics Service with improved error handling and data validation
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
        const errorMessage = tokenError?.message || 'Unknown error';
        appLogger.error('Error processing token', createLogMetadata(undefined, {
          token: tokenData.token,
          error: errorMessage
        }));
      }
    }
    
    return { success: true, message: 'Pilot token table initialized' };
  } catch (error) {
    const errorMessage = error?.message || 'Unknown error';
    const errorStack = error?.stack || 'No stack trace';
    
    appLogger.error('Error initializing pilot token table', createLogMetadata(undefined, { 
      error: errorMessage,
      stack: errorStack
    }));
    return { success: false, message: `Error initializing pilot token table: ${errorMessage}` };
  }
}

/**
 * Validates if a string is a valid UUID
 */
function isValidUUID(str) {
  // Simple regex to check UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  return uuidRegex.test(str);
}

/**
 * Safely stringify data to JSON
 * @returns {string} JSON string or "{}" if failed
 */
function safeJSONStringify(data) {
  if (!data) return '{}';
  
  try {
    return JSON.stringify(data);
  } catch (err) {
    appLogger.warn('Failed to stringify data to JSON', createLogMetadata(undefined, {
      error: err?.message || 'Unknown error',
      dataType: typeof data
    }));
    return '{}';
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
    appLogger.info('Enhanced AnalyticsService initialized with database pool', createLogMetadata(undefined, {
      poolStatus: 'valid'
    }));
  }

  /**
   * Save analytics events to database with enhanced error handling and input validation
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
      
      // Validate UUID format for sessionId
      if (!isValidUUID(sessionId)) {
        appLogger.error('Invalid sessionId format in saveEvents', createLogMetadata(undefined, {
          userId: userId || 'anonymous',
          sessionId
        }));
        return { success: false, eventsProcessed: 0, error: 'Invalid sessionId format' };
      }
      
      // Validate userId format if provided
      if (userId && !isValidUUID(userId)) {
        appLogger.warn('Invalid userId format in saveEvents, will use null instead', createLogMetadata(undefined, {
          userId,
          sessionId
        }));
        userId = null; // Use null for invalid userId to prevent database errors
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
      try {
        const sampleEvent = events[0] ? { 
          eventType: events[0].eventType || 'unknown',
          area: events[0].area || 'unknown',
          hasData: !!events[0].data
        } : 'No events';
        
        appLogger.info('Analytics events received', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          eventCount: events.length,
          eventTypes: events.filter(e => e && e.eventType).map(e => e.eventType).join(', '),
          areas: [...new Set(events.filter(e => e && e.area).map(e => e.area))].join(', '),
          sampleEvent
        }));
      } catch (loggingError) {
        // Don't let logging errors stop the process
        appLogger.warn('Error logging event details', createLogMetadata(undefined, {
          error: loggingError?.message || 'Unknown error'
        }));
      }
      
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
            error: consentError?.message || 'Unknown error'
          }));
          // Continue anyway for pilot study
        }
      }

      // Try to update or create the session record
      let sessionUpdated = false;
      try {
        await this.updateSession(sessionId, userId);
        sessionUpdated = true;
      } catch (sessionError) {
        appLogger.error('Error updating session record', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          error: sessionError?.message || 'Unknown error',
          stack: sessionError?.stack || 'No stack trace'
        }));
        // Continue anyway - we should still attempt to save events
      }

      // Process the events for insertion
      appLogger.debug('Processing events for DB insertion', createLogMetadata(undefined, {
        sessionId,
        eventCount: events.length,
        sessionUpdated
      }));
      
      // Batch insert the events
      const values = events.map(event => {
        try {
          if (!event) {
            appLogger.warn('Null or undefined event in batch', createLogMetadata(undefined, { sessionId }));
            return null;
          }
          
          // Generate a valid UUID for the event
          const eventId = uuidv4();
          
          // Ensure eventType and area are valid strings
          const eventType = (event.eventType && typeof event.eventType === 'string') 
            ? event.eventType.substring(0, 50) // Limit to field size
            : 'unknown';
            
          const area = (event.area && typeof event.area === 'string')
            ? event.area.substring(0, 50) // Limit to field size
            : 'unknown';
          
          // Parse timestamp or use current time
          let timestamp;
          try {
            timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
            // Validate the timestamp
            if (isNaN(timestamp.getTime())) {
              timestamp = new Date(); // Fallback to current time
              appLogger.warn('Invalid timestamp in event, using current time', createLogMetadata(undefined, {
                sessionId,
                providedTimestamp: event.timestamp
              }));
            }
          } catch (timeError) {
            timestamp = new Date(); // Fallback to current time
            appLogger.warn('Error parsing timestamp, using current time', createLogMetadata(undefined, {
              sessionId,
              error: timeError?.message || 'Unknown error'
            }));
          }
          
          // Safely stringify the data
          const dataJson = safeJSONStringify(event.data || {});
          
          return {
            id: eventId,
            sessionId: sessionId,
            userId: userId || null,
            eventType: eventType,
            area: area,
            timestamp: timestamp,
            data: dataJson
          };
        } catch (eventParsingError) {
          appLogger.error('Error parsing event data', createLogMetadata(undefined, {
            sessionId,
            error: eventParsingError?.message || 'Unknown error',
            eventData: typeof event === 'object' ? 'object' : typeof event
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
        
        let result;
        try {
          // Execute the query with additional error handling
          result = await this.pool.query(query, flatParams);
        } catch (dbError) {
          // Handle common database errors
          if (dbError.code === '23505') {
            appLogger.error('Duplicate key violation in insert', createLogMetadata(undefined, {
              code: dbError.code,
              detail: dbError.detail || 'No detail',
              sessionId
            }));
            return { 
              success: false, 
              eventsProcessed: 0, 
              error: 'Duplicate event IDs detected' 
            };
          } else if (dbError.code === '42P01') {
            appLogger.error('Table does not exist', createLogMetadata(undefined, {
              code: dbError.code,
              detail: dbError.detail || 'No detail',
              sessionId
            }));
            return { 
              success: false, 
              eventsProcessed: 0, 
              error: 'Analytics tables not found. Please run database migrations.' 
            };
          } else {
            // Re-throw for general handler
            throw dbError;
          }
        }
        
        const insertedCount = result.rowCount || 0;

        // Update the session with the new event count if we successfully created/updated it
        if (sessionUpdated) {
          try {
            const updateSessionQuery = `
              UPDATE analytics_sessions
              SET events_count = events_count + $1, 
                  updated_at = NOW()
              WHERE id = $2
            `;
            await this.pool.query(updateSessionQuery, [insertedCount, sessionId]);
          } catch (updateSessionError) {
            appLogger.error('Error updating session event count', createLogMetadata(undefined, {
              sessionId,
              error: updateSessionError?.message || 'Unknown error',
              stack: updateSessionError?.stack || 'No stack trace'
            }));
            // Continue anyway - this doesn't affect the success of event insertion
          }
        }

        appLogger.info('Analytics events saved successfully', createLogMetadata(undefined, {
          userId: userId || 'anonymous',
          sessionId,
          eventCount: insertedCount,
          eventTypes: events.filter(e => e && e.eventType).map(e => e.eventType).join(', ')
        }));

        return { success: true, eventsProcessed: insertedCount };
      } catch (insertError) {
        const errorMessage = insertError?.message || 'Unknown error';
        const errorCode = insertError?.code || 'No code';
        const errorDetail = insertError?.detail || 'No detail';
        const errorStack = insertError?.stack || 'No stack trace';
        
        appLogger.error('Error executing insert query', createLogMetadata(undefined, {
          sessionId,
          userId: userId || 'anonymous',
          error: errorMessage,
          code: errorCode,
          detail: errorDetail,
          stack: errorStack
        }));
        
        return { 
          success: false, 
          eventsProcessed: 0, 
          error: `Database error (${errorCode}): ${errorMessage}` 
        };
      }
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      
      appLogger.error('Unhandled error in saveEvents', createLogMetadata(undefined, {
        userId: userId || 'anonymous',
        sessionId: sessionId || 'unknown',
        eventCount: events ? events.length : 0,
        error: errorMessage,
        stack: errorStack
      }));
      
      return { 
        success: false, 
        eventsProcessed: 0, 
        error: `Unhandled error: ${errorMessage}`
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
      
      if (!isValidUUID(sessionId)) {
        throw new Error('Invalid UUID format for sessionId');
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
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      
      appLogger.error('Error in updateSession', createLogMetadata(undefined, {
        sessionId,
        userId: userId || 'anonymous',
        error: errorMessage,
        stack: errorStack
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
      
      if (!isValidUUID(sessionId)) {
        appLogger.error('Invalid UUID format for sessionId in endSession', createLogMetadata(undefined, {
          sessionId
        }));
        return false;
      }
      
      // Validate duration
      let validDuration = 0;
      if (duration) {
        // Parse duration to a number if it's not already
        if (typeof duration !== 'number') {
          try {
            validDuration = parseInt(duration, 10) || 0;
          } catch (parseError) {
            appLogger.warn('Invalid duration provided, using 0', createLogMetadata(undefined, {
              sessionId, 
              providedDuration: duration,
              error: parseError?.message || 'Unknown error'
            }));
            validDuration = 0;
          }
        } else {
          validDuration = duration;
        }
        
        // Make sure duration is positive
        if (validDuration < 0) {
          appLogger.warn('Negative duration provided, using 0', createLogMetadata(undefined, {
            sessionId, 
            providedDuration: duration
          }));
          validDuration = 0;
        }
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
      
      const result = await this.pool.query(query, [validDuration, sessionId]);
      
      const rowsAffected = result.rowCount || 0;
      if (rowsAffected === 0) {
        appLogger.warn('No session found to end', createLogMetadata(undefined, {
          sessionId
        }));
      } else {
        appLogger.info('Successfully ended session', createLogMetadata(undefined, {
          sessionId,
          duration: validDuration
        }));
      }
      
      return rowsAffected > 0;
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      
      appLogger.error('Error ending session', createLogMetadata(undefined, {
        sessionId,
        error: errorMessage,
        stack: errorStack
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
      
      if (!isValidUUID(userId)) {
        appLogger.error('Invalid UUID format for userId in getConsentStatus', createLogMetadata(undefined, {
          userId
        }));
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
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      
      appLogger.error('Error getting consent status', createLogMetadata(undefined, {
        userId,
        error: errorMessage,
        stack: errorStack
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
      
      if (!isValidUUID(userId)) {
        appLogger.error('Invalid UUID format for userId in updateConsent', createLogMetadata(undefined, {
          userId,
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
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      
      appLogger.error('Error updating consent status', createLogMetadata(undefined, {
        userId,
        status,
        error: errorMessage,
        stack: errorStack
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
      
      // Sanitize the token
      const sanitizedToken = typeof token === 'string' 
        ? token.trim().substring(0, 50) // Limit to field size
        : String(token).trim().substring(0, 50);
      
      // Query the pilot_tokens table
      const result = await this.pool.query(
        'SELECT token, participant_type, used_at FROM pilot_tokens WHERE token = $1',
        [sanitizedToken]
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
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      
      appLogger.error('Error validating pilot token', createLogMetadata(undefined, {
        token,
        error: errorMessage,
        stack: errorStack
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
      
      // Sanitize inputs
      const sanitizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : String(email).trim().toLowerCase();
      const sanitizedToken = typeof token === 'string' ? token.trim() : String(token).trim();
      const sanitizedType = typeof participantType === 'string' ? participantType.trim() : String(participantType).trim();
      
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
        const errorMessage = consentError?.message || 'Unknown error';
        
        appLogger.error('Error setting initial consent for pilot participant', createLogMetadata(undefined, {
          userId,
          error: errorMessage
        }));
        // Continue anyway - this is not critical
      }
      
      // Log the registration event
      appLogger.info('Pilot participant registered', createLogMetadata(undefined, {
        userId,
        participantType: sanitizedType,
        email: sanitizedEmail
      }));
      
      return {
        success: true,
        userId,
        token: authToken
      };
    } catch (error) {
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack || 'No stack trace';
      
      appLogger.error('Error registering pilot participant', createLogMetadata(undefined, {
        email,
        token,
        participantType,
        error: errorMessage,
        stack: errorStack
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
    try {
      appLogger.info('Getting analytics metrics raw request', createLogMetadata(undefined, {
        rawRequest: request ? JSON.stringify(request) : 'undefined'
      }));
    } catch (logError) {
      appLogger.warn('Error logging request', createLogMetadata(undefined, {
        error: logError?.message || 'Unknown error'
      }));
    }

    try {
      if (!request) {
        throw new Error('Missing request object');
      }
      
      const { startDate, endDate, filters } = request;
      
      // Ensure we have valid dates - additional safety checks
      let dateStart, dateEnd;
      try {
        // Use a default if no startDate or if it's invalid
        if (!startDate || typeof startDate !== 'string' || startDate.trim() === '') {
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
              providedStartDate: startDate
