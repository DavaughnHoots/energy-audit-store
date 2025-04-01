# Recommendation Updates Implementation Plan

## Overview

This document outlines the plan to fix issues with updating recommendation status and implementation details in the Energy Audit Reports section. Currently, there are two critical errors when attempting to interact with recommendations:

1. **Status Update Error (500)**: When changing a recommendation from "Active" to "Implemented", the API call fails with a 500 Internal Server Error
2. **Implementation Details Error (404)**: When trying to save implementation date and cost, the API call fails with a 404 Not Found error

## Root Causes

### Status Update Endpoint (500 Error)
- **Frontend**: Sends `status` and `actualSavings` to `/api/recommendations/:id/status`
- **Backend**: Expects `status` and `implementationDate` (not `actualSavings`)
- **Result**: Server error when trying to use an undefined value

### Implementation Details Endpoint (404 Error)
- **Frontend**: Calls `/api/recommendations/:id/implementation-details`
- **Backend**: This endpoint doesn't exist
- **Result**: 404 Not Found error

## Implementation Plan

### Phase 1: Backend Fixes

#### 1. Fix Status Update Endpoint
- [x] Modify the `recommendations.ts` router to accept `actualSavings` parameter
- [ ] Update the SQL query to store `actualSavings` when provided
- [ ] Add error handling for missing parameters
- [ ] Add proper validation for actualSavings (ensure it's a number)
- [ ] Log successful updates with relevant data

```typescript
// Modified backend code for /api/recommendations/:id/status
router.put('/:id/status', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, actualSavings, implementationDate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await client.query('BEGIN');

    // Verify ownership
    const ownershipCheck = await client.query(`
      SELECT ea.user_id
      FROM audit_recommendations ar
      JOIN energy_audits ea ON ar.audit_id = ea.id
      WHERE ar.id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to update this recommendation' });
    }

    // Update recommendation status
    await client.query(`
      UPDATE audit_recommendations
      SET status = $1,
          implementation_date = $2,
          actual_savings = COALESCE($3, actual_savings),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [status, implementationDate, actualSavings, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ 
      message: 'Status updated successfully',
      recommendation: {
        id,
        status,
        implementationDate,
        actualSavings
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating recommendation status:', { error });
    res.status(500).json({ error: 'Failed to update recommendation status' });
  } finally {
    client.release();
  }
});
```

#### 2. Add Implementation Details Endpoint
- [ ] Create new endpoint at `/api/recommendations/:id/implementation-details`
- [ ] Implement database query to update implementation details
- [ ] Add proper validation for implementation date and cost
- [ ] Ensure ownership verification
- [ ] Handle transaction management with proper rollback
- [ ] Include detailed error responses

```typescript
// New endpoint for /api/recommendations/:id/implementation-details
router.put('/:id/implementation-details', validateToken, async (req: AuthenticatedRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { implementationDate, implementationCost } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!implementationDate) {
      return res.status(400).json({ error: 'Implementation date is required' });
    }

    if (typeof implementationCost !== 'number' || isNaN(implementationCost)) {
      return res.status(400).json({ error: 'Implementation cost must be a valid number' });
    }

    await client.query('BEGIN');

    // Verify ownership
    const ownershipCheck = await client.query(`
      SELECT ea.user_id
      FROM audit_recommendations ar
      JOIN energy_audits ea ON ar.audit_id = ea.id
      WHERE ar.id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0 || ownershipCheck.rows[0].user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Not authorized to update this recommendation' });
    }

    // Update implementation details
    await client.query(`
      UPDATE audit_recommendations
      SET implementation_date = $1,
          implementation_cost = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [implementationDate, implementationCost, id]);

    await client.query('COMMIT');

    // Invalidate dashboard cache
    await dashboardService.invalidateUserCache(userId);

    res.json({ 
      message: 'Implementation details updated successfully',
      details: {
        implementationDate,
        implementationCost
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    appLogger.error('Error updating implementation details:', { error });
    res.status(500).json({ error: 'Failed to update implementation details' });
  } finally {
    client.release();
  }
});
```

### Phase 2: Frontend Adjustments

#### 1. Update reportService.ts to Handle New API Responses
- [ ] Add better error handling for API responses
- [ ] Implement verbose logging to track API calls and responses
- [ ] Update function documentation

```typescript
// Updated frontend updateRecommendationStatus function
export const updateRecommendationStatus = async (
  recommendationId: string,
  status: 'active' | 'implemented',
  actualSavings?: number
): Promise<void> => {
  try {
    console.log(`Updating recommendation status: ID=${recommendationId}, status=${status}, actual savings=${actualSavings}`);
    
    // Construct payload with default date if needed
    const payload: any = { status };
    
    // Only include actual savings if it's a valid number
    if (typeof actualSavings === 'number' && !isNaN(actualSavings)) {
      payload.actualSavings = actualSavings;
    }
    
    // If implementing and no date provided, use current date
    if (status === 'implemented') {
      payload.implementationDate = new Date().toISOString().split('T')[0];
    }
    
    const response = await fetchWithAuth(
      getApiUrl(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_STATUS(recommendationId)),
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Status update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update recommendation status: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Recommendation status updated successfully', result);
  } catch (error) {
    console.error('Error updating recommendation status:', error);
    throw error;
  }
};
```

#### 2. Fix Implementation Details Function
- [ ] Ensure consistent error handling
- [ ] Add implementation date validation
- [ ] Improve logging for debugging

```typescript
// Updated frontend updateImplementationDetails function
export const updateImplementationDetails = async (
  recommendationId: string,
  implementationDate: string,
  implementationCost: number
): Promise<void> => {
  try {
    console.log(`Updating implementation details: ID=${recommendationId}, date=${implementationDate}, cost=${implementationCost}`);
    
    // Validate inputs
    if (!implementationDate) {
      throw new Error('Implementation date is required');
    }
    
    if (typeof implementationCost !== 'number' || isNaN(implementationCost)) {
      throw new Error('Implementation cost must be a valid number');
    }
    
    const response = await fetchWithAuth(
      getApiUrl(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_DETAILS(recommendationId)),
      {
        method: 'PUT',
        body: JSON.stringify({
          implementationDate,
          implementationCost
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Implementation details update failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to update implementation details: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Implementation details updated successfully', result);
  } catch (error) {
    console.error('Error updating implementation details:', error);
    throw error;
  }
};
```

### Phase 3: Documentation and Testing

#### 1. Update Documentation
- [ ] Update API documentation in the vault
- [ ] Document the new endpoint and parameter changes
- [ ] Add examples of successful API calls
- [ ] Update any affected frontend component documentation

#### 2. Testing Plan
- [ ] Test updating status from active to implemented
- [ ] Test providing actual savings during status update
- [ ] Test updating implementation details (date and cost)
- [ ] Test error handling for invalid inputs
- [ ] Test frontend UI behavior when APIs succeed
- [ ] Test frontend UI behavior when APIs fail

## Implementation Checklist

### Backend
- [x] Update status endpoint to handle actualSavings parameter
- [x] Add implementation details endpoint 
- [x] Add input validation
- [ ] Test backend API endpoints with Postman
- [ ] Deploy backend changes

### Frontend
- [x] Update reportService.ts with improved error handling
- [x] Add detailed logging
- [x] Fix default parameters
- [ ] Test frontend with updated backend
- [ ] Deploy frontend changes

### Documentation
- [ ] Update API documentation
- [ ] Add examples of updated API calls
- [ ] Document frontend changes
- [ ] Document testing results
- [ ] Update implementation plan with completion dates

## Timeline
- Backend fixes: 1 day
- Frontend adjustments: 0.5 day
- Testing: 0.5 day
- Documentation: 0.5 day
- Deployment: 0.5 day

Total estimated time: 3 days
