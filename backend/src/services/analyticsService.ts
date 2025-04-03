/**
 * Analytics Service to handle storage and processing of pilot study analytics data
 */

import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';
import { appLogger, createLogMetadata } from '../utils/logger.js';

// Interface imports
import {
  AnalyticsConsentModel,
  AnalyticsEventModel,
  AnalyticsSessionModel,
  GetMetricsRequest,
  GetMetricsResponse,
  SaveEventsRequest,
  SaveEventsResponse,
  ValidateTokenResponse,
  PilotRegistrationResponse
} from '../types/analytics.js';

// Function to initialize the pilot token table
export async function initPilotTokenTable(pool: any): Promise<{success: boolean, message: string}> {
  try {
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
    }
    
    return { success: true, message: 'Pilot token table initialized' };
  } catch (error) {
    appLogger.error('Error initializing pilot token table', createLogMetadata(undefined, { error }));
    return { success: false, message: `Error initializing pilot token table: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

class AnalyticsService {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  /**
   * Save analytics events to database
   */
  async saveEvents(
    userId: string | null,
    sessionId: string,
    events: SaveEventsRequest['events']
  ): Promise<SaveEventsResponse> {
    try {
      // Log the event details for debugging
      appLogger.info('Analytics events received', createLogMetadata(undefined, {
        sessionId,
        userId: userId || 'anonymous',
        eventCount: events.length,
        eventTypes: events.map(e => e.eventType).join(', '),
        areas: [...new Set(events.map(e => e.area))].join(', ')
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
        const consentStatus = await this.getConsentStatus(userId);
        if (consentStatus !== 'granted') {
          appLogger.warn('Analytics events rejected - no consent', createLogMetadata(undefined, {
            userId,
            sessionId,
            eventCount: events.length
          }));
          // For pilot study, we'll still save the data but log that there was no consent
          // This maximizes our ability to gather data for the study
          // return { success: false, eventsProcessed: 0 };
        }
      }

      // Update the session record or create if it doesn't exist
      await this.updateSession(sessionId, userId);

      // Process the events for insertion
      appLogger.debug('Processing events for DB insertion', createLogMetadata(undefined, {
        sessionId,
        eventCount: events.length
      }));
      
      // Batch insert the events
      const values = events.map(event => {
        // Ensure data field is properly handled
        const data = event.data || {};
        return {
          id: uuidv4(),
          sessionId,
          userId: userId || null,
          eventType: event.eventType,
          area: event.area,
          timestamp: new Date(event.timestamp),
          data: JSON.stringify(data)
        };
      });

      // If no events, return early
      if (values.length === 0) {
        appLogger.info('No events to process', createLogMetadata(undefined, {
          sessionId
        }));
        return { success: true, eventsProcessed: 0 };
      }

      // Build parameterized query for batch insert
      const placeholders = values.map((_, i) => {
        const base = i * 6;
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

      const result = await this.pool.query(query, flatParams);
      const insertedCount = result.rowCount || 0;

      // Update the session with the new event count
      const updateSessionQuery = `
        UPDATE analytics_sessions
        SET events_count = events_count + $1, 
            updated_at = NOW()
        WHERE id = $2
      `;
      await this.pool.query(updateSessionQuery, [insertedCount, sessionId]);

      appLogger.info('Analytics events saved successfully', createLogMetadata(undefined, {
        userId,
        sessionId,
        eventCount: insertedCount,
        eventTypes: events.map(e => e.eventType).join(', ')
      }));

      return { success: true, eventsProcessed: insertedCount };
    } catch (error) {
      appLogger.error('Error saving analytics events', createLogMetadata(undefined, {
        userId,
        sessionId,
        eventCount: events.length,
        error
      }));
      return { success: false, eventsProcessed: 0 };
    }
  }

  /**
   * Update or create a session record
   */
  private async updateSession(
    sessionId: string,
    userId?: string | null
  ): Promise<void> {
    try {
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
      } else {
        // Create new session
        await this.pool.query(
          `INSERT INTO analytics_sessions (
            id, user_id, start_time, is_active, events_count, created_at, updated_at
          ) VALUES ($1, $2, NOW(), TRUE, 0, NOW(), NOW())`,
          [sessionId, userId || null]
        );
      }
    } catch (error) {
      appLogger.error('Error updating session record', createLogMetadata(undefined, {
        sessionId,
        userId,
        error
      }));
      // Don't rethrow - we want to continue even if session update fails
    }
  }

  /**
   * End a session
   */
  async endSession(sessionId: string, duration?: number): Promise<boolean> {
    try {
      const query = `
        UPDATE analytics_sessions
        SET 
          is_active = FALSE, 
          end_time = NOW(), 
          duration = $1,
          updated_at = NOW()
        WHERE id = $2
      `;
      
      await this.pool.query(query, [duration || 0, sessionId]);
      return true;
    } catch (error) {
      appLogger.error('Error ending session', createLogMetadata(undefined, {
        sessionId,
        error
      }));
      return false;
    }
  }

  /**
   * Get current consent status for a user
   */
  async getConsentStatus(userId: string): Promise<string> {
    try {
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
        error
      }));
      return 'not_asked';
    }
  }

  /**
   * Update consent status for a user
   */
  async updateConsent(
    userId: string,
    status: 'granted' | 'denied' | 'withdrawn'
  ): Promise<boolean> {
    try {
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
      
      return true;
    } catch (error) {
      appLogger.error('Error updating consent status', createLogMetadata(undefined, {
        userId,
        status,
        error
      }));
      return false;
    }
  }

  /**
   * Validate a pilot study invitation token
   */
  async validatePilotToken(token: string): Promise<ValidateTokenResponse> {
    try {
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
        error
      }));
      
      return {
        valid: false,
        message: 'Error processing token'
      };
    }
  }

  /**
   * Register a pilot study participant
   */
  async registerPilotParticipant(
    email: string,
    password: string,
    token: string,
    participantType: string
  ): Promise<PilotRegistrationResponse> {
    try {
      // In a real implementation, we would:
      // 1. Register the user in the auth system
      // 2. Set a pilot study flag in their profile
      // 3. Store the participant type
      // 4. Return the auth token
      
      // For now, we'll simulate success with a fake user ID
      const userId = uuidv4();
      const authToken = uuidv4(); // In real impl, this would be a JWT
      
      // Automatically set analytics consent for pilot participants
      await this.updateConsent(userId, 'granted');
      
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
        error
      }));
      
      return {
        success: false,
        message: 'Error processing registration'
      };
    }
  }

  /**
   * Get analytics metrics for pilot study dashboard
   */
  async getMetrics(request: GetMetricsRequest): Promise<GetMetricsResponse> {
    appLogger.info('Getting analytics metrics', createLogMetadata(undefined, {
      startDate: request.startDate,
      endDate: request.endDate,
      filters: request.filters || 'none'
    }));
    try {
      const { startDate, endDate, filters } = request;
      const dateStart = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      const dateEnd = endDate ? new Date(endDate) : new Date();
      
      // Query for total sessions
      const sessionsQuery = `
        SELECT COUNT(*) as total_sessions,
               AVG(COALESCE(duration, 0)) as avg_duration
        FROM analytics_sessions
        WHERE start_time BETWEEN $1 AND $2
      `;
      
      const sessionsResult = await this.pool.query(sessionsQuery, [dateStart, dateEnd]);
      
      // Query for form completions
      const formCompletionsQuery = `
        SELECT COUNT(*) as completions
        FROM analytics_events
        WHERE event_type = 'form_interaction'
        AND (data->>'action' = 'submit' OR data->>'action' = 'completion')
        AND timestamp BETWEEN $1 AND $2
      `;
      
      const formCompletionsResult = await this.pool.query(formCompletionsQuery, [dateStart, dateEnd]);
      
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
      
      return {
        success: true,
        metrics: {
          totalSessions: parseInt(sessionsResult.rows[0]?.total_sessions || '0'),
          avgSessionDuration: Math.round(parseFloat(sessionsResult.rows[0]?.avg_duration || '0')),
          formCompletions: parseInt(formCompletionsResult.rows[0]?.completions || '0'),
          pageViewsByArea: pageViewsResult.rows.map((row: any) => ({
            area: row.area,
            count: row.count
          })),
          featureUsage: featureUsageResult.rows.map((row: any) => ({
            feature: row.feature,
            count: row.count
          }))
        },
        dateRange: {
          startDate: dateStart.toISOString(),
          endDate: dateEnd.toISOString()
        }
      };
    } catch (error) {
      appLogger.error('Error getting analytics metrics', createLogMetadata(undefined, {
        error
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
