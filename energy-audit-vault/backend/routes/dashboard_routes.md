---
title: "Dashboard Routes"
type: "API Routes"
path: "backend/src/routes/dashboard.ts"
description: "API routes for serving dashboard statistics and data"
tags: [backend, api, dashboard, statistics]
status: "up-to-date"
last_verified: "2025-03-31"
---

# Dashboard Routes

## Overview
The Dashboard API routes provide authenticated access to user-specific dashboard statistics and metrics. These endpoints serve data for the user dashboard interface, including energy savings summaries, recommendations, and audit-specific information.

## Available Endpoints

### GET `/api/dashboard/stats`
Retrieves general dashboard statistics for the authenticated user.

#### Authentication
- Required: Yes
- Middleware: `authenticate`

#### Query Parameters
- `newAudit` (optional): ID of a newly completed audit to include in the statistics

#### Response
- Status: 200 OK
- Content-Type: application/json
- Body:
```json
{
  "totalSavings": {
    "estimated": 1200.50,
    "actual": 985.75,
    "accuracy": 82.1
  },
  "completedAudits": 3,
  "activeRecommendations": 7,
  "implementedChanges": 4,
  "monthlySavings": [
    {
      "month": "January",
      "estimated": 95.0,
      "actual": 87.5
    },
    // ...additional months
  ],
  "latestAuditId": "3e55555a-15b4-4e2d-be83-5d6a7f6b2ff3",
  "recommendations": [...],
  "userId": "auth0|123456789",
  "lastUpdated": "2025-03-31T12:34:56.789Z",
  "refreshInterval": 300000
}
```

#### Error Responses
- **401 Unauthorized**
  - When no valid authentication token is provided
  ```json
  {
    "error": "Authentication required",
    "details": "Please sign in to access your dashboard statistics",
    "code": "AUTH_REQUIRED"
  }
  ```

- **403 Forbidden**
  - When user setup is incomplete
  ```json
  {
    "error": "Setup required",
    "details": "Please complete your property setup to view dashboard statistics",
    "code": "SETUP_REQUIRED",
    "setupUrl": "/settings/property"
  }
  ```

- **500 Internal Server Error**
  - When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "details": "An unexpected error occurred. Our team has been notified.",
    "code": "INTERNAL_ERROR"
  }
  ```

### GET `/api/dashboard/audit-stats/:auditId`
Retrieves dashboard statistics specific to a particular audit.

#### Authentication
- Required: Yes
- Middleware: `authenticate`

#### Path Parameters
- `auditId`: The unique ID of the energy audit

#### Response
- Status: 200 OK
- Content-Type: application/json
- Body:
```json
{
  "totalSavings": {
    "estimated": 850.25,
    "actual": 725.50,
    "accuracy": 85.3
  },
  "completedAudits": 3,
  "activeRecommendations": 5,
  "implementedChanges": 2,
  "monthlySavings": [
    {
      "month": "January",
      "estimated": 70.0,
      "actual": 65.0
    },
    // ...additional months
  ],
  "recommendations": [...],
  "lastUpdated": "2025-03-31T12:34:56.789Z",
  "refreshInterval": 300000,
  "specificAuditId": "3e55555a-15b4-4e2d-be83-5d6a7f6b2ff3"
}
```

#### Error Responses
- **400 Bad Request**
  - When the audit ID is missing
  ```json
  {
    "error": "Bad request",
    "details": "Audit ID is required",
    "code": "MISSING_AUDIT_ID"
  }
  ```

- **401 Unauthorized**
  - When no valid authentication token is provided
  ```json
  {
    "error": "Authentication required",
    "details": "Please sign in to access your dashboard statistics",
    "code": "AUTH_REQUIRED"
  }
  ```

- **403 Forbidden**
  - When user doesn't have access to the requested audit
  ```json
  {
    "error": "Access denied",
    "details": "You do not have permission to access this audit",
    "code": "ACCESS_DENIED"
  }
  ```

- **404 Not Found**
  - When the requested audit doesn't exist
  ```json
  {
    "error": "Audit not found",
    "details": "The requested audit does not exist",
    "code": "AUDIT_NOT_FOUND"
  }
  ```

- **500 Internal Server Error**
  - When an unexpected error occurs
  ```json
  {
    "error": "Internal server error",
    "details": "An unexpected error occurred while fetching audit statistics",
    "code": "INTERNAL_ERROR"
  }
  ```

### GET `/api/dashboard/product-history`
Retrieves product history and comparison data for the authenticated user.

#### Authentication
- Required: Yes
- Middleware: `authenticate`

#### Query Parameters
- `limit` (optional): Maximum number of products to return (default: 20)

#### Response
- Status: 200 OK
- Content-Type: application/json
- Body:
```json
{
  "success": true,
  "productHistory": [
    {
      "id": "prod_123",
      "name": "High-Efficiency HVAC System",
      "category": "HVAC",
      "dateSaved": "2025-02-15T09:30:00Z",
      "price": 2499.99,
      "efficiency": 95,
      "details": {...}
    },
    // Additional products
  ]
}
```

#### Error Handling
- Unlike other endpoints, this endpoint will always return HTTP 200 OK, even in error cases.
- In case of errors, it returns an empty product array with a warning message:
```json
{
  "success": true,
  "productHistory": [],
  "warning": "Could not retrieve product history, showing empty list instead"
}
```

## Implementation Details

The dashboard routes use the `dashboardService` for main business logic and data retrieval, with additional security checks:

- All routes require valid authentication via the `authenticate` middleware
- The audit-specific endpoint verifies user ownership before returning data
- The endpoints handle various error scenarios gracefully with informative messages
- Features are designed to work with the frontend's auto-loading audit fallback mechanism

## Security Considerations
- All endpoints enforce authentication
- User ownership of audits is verified before returning audit-specific data
- Error messages are designed to avoid leaking sensitive information

## Related Files
- [[backend/services/dashboard_service|Dashboard Service]]
- [[frontend/pages/user_dashboard_page|User Dashboard Page]]
- [[frontend/features/auto_loading_latest_audit|Auto-Loading Latest Audit]]
- [[backend/routes/auditHistory_enhanced|Audit History Routes]]
