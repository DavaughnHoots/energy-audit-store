---
title: "Auth Token Response Format Fix"
type: "Bug Fix"
path: "backend/src/routes/auth.ts"
description: "Fix token refresh response format issue causing dashboard loading failures"
tags: [auth, token, refresh, login, dashboard, bug-fix]
status: "in-progress"
last_verified: "2025-04-22"
---

# Auth Token Response Format Fix

## Issue Description

Users are experiencing issues when loading their dashboard after login. The specific error occurs during token refresh operations.

Console logs show a pattern of:
1. Initial login succeeds
2. Subsequent API calls fail with 401 errors
3. Token refresh attempts fail with "Invalid or missing token in refresh response"
4. Dashboard fails to load data

After thorough investigation, the root cause has been identified as a mismatch between frontend expectations and backend response format for the token refresh endpoint.

## Root Cause Analysis

1. **Token Response Format Mismatch**:
   - The frontend's `AuthContext.tsx` expects the refresh token endpoint to return JSON with `token` and `refreshToken` fields in the response body
   - The backend's `/refresh-token` endpoint only sets cookies and returns `{ message: 'Tokens refreshed successfully' }` without including the actual tokens in the response body

2. **Token Storage Inconsistency**:
   - With our recent token storage fix, we're properly cleaning invalid tokens from cookies
   - But when tokens need refreshing, the server isn't returning them in a way that can be stored in localStorage as a backup

3. **Authentication Flow Breakdown**:
   - User logs in (initially gets tokens as cookies)
   - Front-end can't extract token values (because the response lacks them)
   - When API calls later need tokens, the cycle of refresh attempt → no tokens in response → auth failure begins

## Implementation Checklist

- [x] Modify `backend/src/routes/auth.ts` refresh-token endpoint to include tokens in response
- [ ] Ensure alignment with `AuthContext.tsx` expectations
- [ ] Test login flow locally
- [ ] Deploy changes to Heroku
- [ ] Verify fix in production environment

## Required Changes

### In `backend/src/routes/auth.ts`

Modify the `/refresh-token` endpoint to return token values in the response body in addition to setting cookies:

```javascript
// Current implementation:
res.cookie('accessToken', result.accessToken, {...});
res.cookie('refreshToken', result.refreshToken, {...});
res.json({ message: 'Tokens refreshed successfully' });

// Updated implementation:
res.cookie('accessToken', result.accessToken, {...});
res.cookie('refreshToken', result.refreshToken, {...});
res.json({ 
  message: 'Tokens refreshed successfully',
  token: result.accessToken,   // Include token in response
  refreshToken: result.refreshToken  // Include refresh token in response
});
```

## Deployment Plan

1. Make changes directly to files (no scripts)
2. Commit changes with descriptive message
3. Push to GitHub
4. Push to Heroku for deployment

## Expected Outcome

After implementing these changes:
1. User login will succeed
2. Token refresh operations will return tokens in response body
3. Frontend will be able to store tokens both in cookies and localStorage
4. Dashboard data will load successfully
5. Users will no longer see error messages or blank dashboards