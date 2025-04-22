---
title: "Auth Token Field Naming Fix"
type: "Bug Fix"
path: "backend/src/routes/auth.ts"
description: "Fix token field naming inconsistency in refresh token endpoint response"
tags: [auth, token, refresh, login, dashboard, bug-fix]
status: "in-progress"
last_verified: "2025-04-22"
---

# Auth Token Field Naming Fix

## Issue Summary

Users are experiencing dashboard loading failures due to an inconsistency in the field naming between the backend token refresh endpoint response and what the frontend expects. The refresh token endpoint returns a field named `refreshToken` but is likely missing or misnamed for the access token field (should be named `token` as expected by frontend).

## Investigation

Console logs show the following issues:

```
Token refresh response structure: message, refreshToken
⚠️ Invalid or missing token in refresh response
```

This indicates that while the `refreshToken` field is present in the response, the `token` field (for access token) is either missing or named differently.

Additionally, there are cookie storage failures:

```
⚠️ Cookie verification failed for refreshToken
🔄 Retrying cookie set (attempt 1)...
❌ Failed to set cookie refreshToken after 2 retries
```

And a 500 error during token refresh:

```
POST https://energy-audit-store-e66479ed4f2b.herokuapp.com/api/auth/refresh-token 500 (Internal Server Error)
```

## Root Cause

The issue appears to be a field naming inconsistency. The frontend expects a field named `token` in the token refresh response for the access token, but the backend is either:

1. Using a different field name (e.g., `accessToken`)
2. Not including the access token in the response at all

This causes authentication to fail since the frontend cannot retrieve and store the access token properly.

## Implementation Checklist

- [x] Examine `backend/src/routes/auth.ts` refresh token endpoint to check field names
- [x] Check `backend/src/services/userAuthService.ts` for token field naming consistency
- [x] Check frontend token handling in `src/context/AuthContext.tsx` for expected field names
- [x] Update refresh token endpoint response with improved validation and logging
- [x] Add proper error handling for the 500 server error case
- [ ] Update cookie settings to ensure proper storage
- [ ] Test the login flow locally
- [ ] Manually deploy changes to Heroku
- [ ] Verify fix in production environment

## Required Changes

### In `backend/src/routes/auth.ts`

After examining the code, we found that the refresh token endpoint was already using the correct field names (`token` and `refreshToken`), but was missing validation and advanced error handling. We've made the following changes:

1. Added validation to ensure accessToken exists before using it
2. Added detailed logging to track response structure
3. Enhanced error handling with better details for 500 errors
4. Improved tracking of response field names

```javascript
// Added validation check for accessToken
if (!result || !result.accessToken) {
  console.error('Error: UserAuthService.refreshToken did not return a valid accessToken');
  return res.status(500).json({ error: 'Failed to generate new access token' });
}

// Added logging of response structure
console.log('Token refresh response structure:', { 
  includesToken: Boolean(result.accessToken),
  includesRefreshToken: Boolean(result.refreshToken)
});

// Improved response construction
const responseBody = { 
  message: 'Tokens refreshed successfully',
  token: result.accessToken,
  refreshToken: result.refreshToken
};

// Log the response keys for debugging
console.log('Token refresh response keys:', Object.keys(responseBody).join(', '));

res.json(responseBody);
```

### Cookie Storage Settings

Ensure proper cookie settings:

```javascript
res.cookie('token', result.accessToken, {
  httpOnly: true,
  secure: true, // For HTTPS
  sameSite: 'None', // For cross-domain scenarios
  maxAge: TOKEN_EXPIRY
});
```

## Testing Plan

1. Test login flow locally
2. Check console logs for token refresh request/response
3. Verify proper field names in response
4. Verify successful dashboard data loading after authentication

## Deployment Steps

1. Make changes to necessary files
2. Commit changes to Git
3. Push to GitHub repository
4. Manually deploy to Heroku using `git push heroku <branch-name>:main`
5. Verify fix in production

## Related Issues

- Token refresh failures
- Dashboard loading errors
- 401 Unauthorized errors after login
- Cookie storage failures
