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
  SaveEventsResponse
} from '../types/analytics.js';

class AnalyticsService {
  private pool: typeof Pool;

  constructor(pool: typeof Pool) {
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
      // First check if consent is given for this user
      if (userId) {
        const consentStatus = await this.getConsentStatus(userId);
        if (consentStatus !== 'granted') {
          appLogger.warn('Analytics events rejected - no consent', createLogMetadata(undefined, {
            userId,
            sessionId,
            eventCount: events.length
          }));
          return { success: false, eventsProcessed: 0 };
        }
      }

      // Update the session record or create if it doesn't exist
      await this.updateSession(sessionId, userId);

      // Batch insert the events
      const values = events.map(event => ({
        id: uuidv4(),
        sessionId,
        userId: userId || null,
        eventType: event.eventType,
        area: event.area,
        timestamp: new Date(event.timestamp),
        data: event.data ? JSON.stringify(event.data) : '{}'
      }));

      // If no events, return early
      if (values.length === 0) {
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
        eventCount: insertedCount
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
   * Get analytics metrics for pilot study dashboard
   */
  async getMetrics(request: GetMetricsRequest): Promise<GetMetricsResponse> {
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
          pageViewsByArea: pageViewsResult.rows.map((row: { area: string, count: number }) => ({
            area: row.area,
            count: row.count
          })),
          featureUsage: featureUsageResult.rows.map((row: { feature: string, count: number }) => ({
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

export default AnalyticsService;
