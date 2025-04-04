---
title: "Direct Analytics Event Sending"
description: "Documentation for the direct analytics event sending implementation"
status: "up-to-date"
last_verified: "2025-04-04"
---

# Direct Analytics Event Sending Implementation

## Issue Description

The analytics system was experiencing issues with data not properly appearing in the admin dashboard despite events being generated in the frontend. The previous approach used a queue-based mechanism that:

1. Collected events in a client-side queue
2. Periodically flushed the queue to the server via batch API calls 
3. Used localStorage to persist the queue between page loads

Issues with the queue-based approach:
- Events might remain in the queue for extended periods if the queue size didn't reach the flush threshold
- Queue flushing relied on the user staying on the page long enough for the auto-flush timer
- When errors occurred during flush operations, all queued events were lost
- Complex queue management added multiple points of failure

## Implementation Solution

To improve reliability and ensure immediate data persistence, we implemented a direct event sending approach that:

1. Sends each analytics event directly to the server as soon as it's created
2. Falls back to queue-based approach only if the direct send fails
3. Ensures data is persisted as close as possible to when the event occurs

### Backend Changes

We added a new endpoint specifically for single event persistence:

```typescript
// In backend/src/routes/analytics.ts
router.post('/event', optionalTokenValidation, async (req, res) => {
  try {
    const { sessionId, event } = req.body;
    const userId = req.user?.id || null;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }
    
    if (!event || typeof event !== 'object') {
      return res.status(400).json({ success: false, message: 'Valid event object is required' });
    }
    
    // Create a single-item array to reuse existing saveEvents method
    const result = await analyticsService.saveEvents(userId, sessionId, [event]);
    
    return res.json({
      success: result.success,
      eventProcessed: result.success ? 1 : 0,
      message: result.success ? 'Event saved successfully' : 'Failed to save event'
    });
  } catch (error) {
    // Error handling...
    return res.status(500).json({ success: false, message: 'Error processing analytics event' });
  }
});
```

### Frontend Changes

In the frontend, we modified the `AnalyticsContext.tsx` to directly send events:

```typescript
/**
 * Send an event directly to the server, bypassing the queue
 */
const sendEventDirectly = useCallback(async (event: any, currentSessionId: string) => {
  console.log(`[Analytics] Sending event directly to server: ${event.eventType} in area: ${event.area}`, event);
  
  try {
    const response = await apiClient.post('/api/analytics/event', {
      event,
      sessionId: currentSessionId
    });
    
    console.log('[Analytics] Successfully sent event directly to server', response.data);
    return true;
  } catch (error) {
    console.error('[Analytics] Failed to send direct event to server:', error);
    // Log error details...
    
    // Fall back to queue if direct send fails
    console.log('[Analytics] Falling back to queue for event');
    addToQueue(event);
    return false;
  }
}, []);

/**
 * Track an event
 */
const trackEvent = useCallback((
  eventType: AnalyticsEventType,
  area: string,
  data: Record<string, any> = {}
) => {
  // Get the most up-to-date sessionId from localStorage as a fallback
  const currentSessionId = sessionId || localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION_ID);
  
  if (!isTrackingEnabled || !currentSessionId) {
    console.log(`[Analytics] Event tracking skipped: ${!isTrackingEnabled ? 'Tracking disabled' : 'No sessionId'}`);
    return;
  }
  
  const event = {
    eventType,
    area,
    timestamp: new Date().toISOString(),
    data: Object.keys(data).length > 0 ? data : undefined
  };
  
  // Send directly to the server instead of queueing
  sendEventDirectly(event, currentSessionId).catch(() => {
    // If direct send fails with an exception, ensure it gets queued as a fallback
    addToQueue(event);
  });
}, [isTrackingEnabled, sessionId, sendEventDirectly, addToQueue]);
```

## Advantages

This direct event sending approach provides several benefits:

1. **Immediacy**: Events are persisted as soon as they occur
2. **Reliability**: No waiting for batch operations
3. **Debuggability**: Each event is individually tracked in network requests
4. **Reduced complexity**: Less queue management logic
5. **Fallback safety**: Events that fail to send directly are still queued as a backup
6. **Better UX**: Users can see the results of their actions reflected in analytics more quickly

## Verification and Testing

To verify this implementation is working correctly:

1. Check browser console logs for "[Analytics] Sending event directly to server..." messages
2. Verify network requests to `/api/analytics/event`
3. Check admin dashboard for real-time updates of analytics data
4. Use browser network inspection tools to monitor successful direct event transmissions

In case of failures, the analytics system will automatically fall back to the queue-based approach, ensuring no data is lost even if direct transmission temporarily fails.

## Future Improvements

While this implementation solves the immediate data persistence issues, future improvements could include:

1. Adding retry logic for failed direct sends before falling back to the queue
2. Implementing real-time updates to the admin dashboard via websockets
3. Adding batch processing capabilities on the server side to handle high-frequency events
4. Implementing event priority levels for selective direct sending vs. queueing
