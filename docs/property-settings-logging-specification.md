# Property Settings Logging Specification

## Overview

This document outlines the standardized logging approach for all Property Settings related components in the Energy Audit Store application. Robust logging is essential for tracking the effectiveness of our auto-population functionality and diagnosing issues in production.

## Logging Standards

### 1. Log Format

All logs should follow a consistent structured JSON format:

```javascript
{
  "timestamp": "2025-04-07T19:49:38.918Z",      // ISO-8601 timestamp
  "level": "info|warn|error|debug",             // Log level
  "component": "userProfileService",            // Component generating the log
  "operation": "populatePropertySettings",      // Specific operation being performed
  "correlation": {
    "request_id": "req-1234-5678-90ab",         // Unique request identifier
    "user_id": "usr-anonymized-id",             // Anonymized user ID 
    "session_id": "sess-1234",                  // Session identifier
    "audit_id": "EAT-1234567890"                // Related audit ID if applicable
  },
  "details": {
    // Operation-specific details
  },
  "performance": {
    "duration_ms": 127                          // Execution time in milliseconds
  }
}
```

### 2. Log Levels

- **ERROR**: Use for exceptions and failures that prevent the application from functioning correctly
- **WARN**: Use for unexpected situations that don't cause application failure but require attention
- **INFO**: Use for tracking normal application flow and key business events
- **DEBUG**: Use for detailed troubleshooting information (only enabled in non-production environments)

### 3. Required Context

Each log entry must include:

- Timestamp
- Component/service name
- Operation being performed
- Request correlation ID
- User ID (anonymized where appropriate)

## Component-Specific Logging

### User Profile Service

#### 1. Property Settings Auto-Population

The `populateDefaultPropertySettings` function should log:

```javascript
// Start of auto-population attempt
{
  "timestamp": "2025-04-07T19:49:38.918Z",
  "level": "info",
  "component": "userProfileService",
  "operation": "populatePropertySettings.start",
  "correlation": {
    "request_id": "req-1234-5678-90ab",
    "user_id": "usr-anonymized-id"
  },
  "details": {
    "has_existing_settings": false,
    "attempting_auto_population": true
  }
}

// Result of auto-population
{
  "timestamp": "2025-04-07T19:49:38.999Z", 
  "level": "info",
  "component": "userProfileService",
  "operation": "populatePropertySettings.complete",
  "correlation": {
    "request_id": "req-1234-5678-90ab",
    "user_id": "usr-anonymized-id",
    "audit_id": "EAT-1234567890"
  },
  "details": {
    "success": true,
    "source": "latest_audit",
    "audit_date": "2025-04-01T00:00:00.000Z",
    "populated_fields": [
      "propertyType", 
      "yearBuilt",
      "squareFootage",
      "stories"
    ],
    "before": {
      // Summary of profile state before population
    },
    "after": {
      // Summary of profile state after population  
    }
  },
  "performance": {
    "duration_ms": 81
  }
}
```

#### 2. Settings Extraction

The `extractPropertySettingsFromAudit` function should log:

```javascript
{
  "timestamp": "2025-04-07T19:49:38.950Z",
  "level": "info",
  "component": "userProfileService",
  "operation": "extractPropertySettings",
  "correlation": {
    "request_id": "req-1234-5678-90ab",
    "user_id": "usr-anonymized-id",
    "audit_id": "EAT-1234567890"
  },
  "details": {
    "extracted_fields": {
      "propertyType": "condominium",
      "yearBuilt": 2008,
      "squareFootage": 1500,
      "stories": 1
    },
    "missing_fields": ["ownershipStatus"],
    "audit_sections_used": ["basicInfo", "homeDetails"]
  },
  "performance": {
    "duration_ms": 32
  }
}
```

### Dashboard Property Settings Tab

#### 1. Tab Initialization

```javascript
{
  "timestamp": "2025-04-07T19:49:40.123Z",
  "level": "info",
  "component": "dashboard.PropertySettingsTab",
  "operation": "initialize",
  "correlation": {
    "request_id": "req-1234-5678-90ab",
    "user_id": "usr-anonymized-id"
  },
  "details": {
    "tab_visible": true,
    "property_settings_available": true,
    "property_settings_source": "auto_populated",
    "property_type": "condominium"
  }
}
```

#### 2. Settings Update Events

```javascript
{
  "timestamp": "2025-04-07T19:50:12.456Z",
  "level": "info",
  "component": "dashboard.PropertySettingsTab",
  "operation": "updateSettings",
  "correlation": {
    "request_id": "req-9876-5432-10cd",
    "user_id": "usr-anonymized-id"
  },
  "details": {
    "updated_fields": ["squareFootage", "yearBuilt"],
    "previous_values": {
      "squareFootage": 1500,
      "yearBuilt": 2008
    },
    "new_values": {
      "squareFootage": 1650,
      "yearBuilt": 2010
    },
    "auto_populated": false,
    "user_modified": true
  },
  "performance": {
    "api_call_ms": 145,
    "total_duration_ms": 190
  }
}
```

## Backend Routes

### User Profile API

#### Property Settings Retrieval

```javascript
{
  "timestamp": "2025-04-07T19:49:38.800Z",
  "level": "info",
  "component": "api.userProfile",
  "operation": "getPropertySettings",
  "correlation": {
    "request_id": "req-1234-5678-90ab",
    "user_id": "usr-anonymized-id"
  },
  "details": {
    "settings_found": true,
    "is_default": true,
    "data_source": "auto_populated",
    "property_type": "condominium"
  },
  "performance": {
    "db_query_ms": 48,
    "total_duration_ms": 65
  }
}
```

#### Property Settings Update

```javascript
{
  "timestamp": "2025-04-07T19:50:12.400Z",
  "level": "info",
  "component": "api.userProfile",
  "operation": "updatePropertySettings",
  "correlation": {
    "request_id": "req-9876-5432-10cd",
    "user_id": "usr-anonymized-id"
  },
  "details": {
    "fields_updated": ["squareFootage", "yearBuilt"],
    "validation_errors": null,
    "success": true
  },
  "performance": {
    "validation_ms": 12,
    "db_update_ms": 87,
    "total_duration_ms": 112
  }
}
```

## Dashboard Data Flow

### Dashboard Data Integration

```javascript
{
  "timestamp": "2025-04-07T19:49:40.000Z",
  "level": "info",
  "component": "dashboard.DataFlow",
  "operation": "integratePropertySettings",
  "correlation": {
    "request_id": "req-1234-5678-90ab",
    "user_id": "usr-anonymized-id",
    "dashboard_id": "dash-5678"
  },
  "details": {
    "property_settings_source": "user_profile",
    "auto_populated": true,
    "missing_fields": [],
    "included_in_dashboard": true,
    "property_info": {
      "address": "400 East Front Street",
      "propertyType": "condominium",
      "yearBuilt": 2008,
      "squareFootage": 1500
    }
  },
  "performance": {
    "data_merge_ms": 28,
    "total_duration_ms": 35
  }
}
```

## Implementation Guidelines

### 1. Where to Place Logging Calls

- Add logging statements at the beginning and end of significant operations
- Log all entry points to property settings-related components
- Log successful completions and error conditions
- Add timing metrics around performance-sensitive operations

### 2. Best Practices

- Use structured logging (JSON format) for all logs
- Include a correlation ID that follows the request through the entire system
- Log enough context to be useful, but avoid excessive information
- Don't log sensitive information (addresses, personal details, etc.)
- Use the appropriate log level for the significance of the event

### 3. Troubleshooting Logs

When auto-population failures occur, include detailed error information:

```javascript
{
  "timestamp": "2025-04-07T19:49:38.999Z",
  "level": "error",
  "component": "userProfileService",
  "operation": "populatePropertySettings",
  "correlation": {
    "request_id": "req-1234-5678-90ab",
    "user_id": "usr-anonymized-id"
  },
  "details": {
    "error": "Failed to fetch latest audit data",
    "error_code": "AUDIT_NOT_FOUND",
    "stack_trace": "...",
    "fallback_applied": true,
    "fallback_source": "default_values"
  }
}
```

## Monitoring and Alerting

Set up monitoring and alerting based on these logs:

1. **Auto-Population Success Rate**: Monitor the percentage of successful auto-population attempts
2. **Missing Data Alerts**: Trigger alerts when a high percentage of users have missing property settings
3. **Performance Degradation**: Alert on slow property settings operations
4. **Error Rate**: Track error rates for property settings components

## Implementation Example

Here is an example implementation of enhanced logging in the `populateDefaultPropertySettings` function:

```typescript
export async function populateDefaultPropertySettings(
  profileData: UserProfileData | null,
  requestId: string = generateUUID()
): Promise<UserProfileData | null> {
  const startTime = performance.now();
  
  if (!profileData) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "populatePropertySettings",
      correlation: { request_id: requestId },
      details: {
        error: "No profile data provided",
        success: false
      },
      performance: {
        duration_ms: Math.round(performance.now() - startTime)
      }
    }));
    return null;
  }
  
  // Get anonymized user ID if available
  const userId = profileData?.email ? 
    `usr-${hashString(profileData.email)}` : 
    'anonymous-user';
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    component: "userProfileService",
    operation: "populatePropertySettings.start",
    correlation: {
      request_id: requestId,
      user_id: userId
    },
    details: {
      has_existing_property_details: !!(profileData.propertyDetails && 
                           Object.keys(profileData.propertyDetails).length > 0),
      has_partial_settings: !!(profileData.propertyDetails || 
                             profileData.windowMaintenance || 
                             profileData.energySystems),
      attempting_auto_population: true
    }
  }));
  
  // Check if property settings are empty or incomplete
  const hasPropertyDetails = profileData.propertyDetails && 
                           Object.keys(profileData.propertyDetails).length > 0;
  
  // Don't auto-populate if we already have property details
  if (hasPropertyDetails) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "populatePropertySettings.complete",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        success: true,
        auto_populated: false,
        reason: "existing_settings_present",
        existing_property_type: profileData.propertyDetails?.propertyType
      },
      performance: {
        duration_ms: Math.round(performance.now() - startTime)
      }
    }));
    return profileData;
  }
  
  // Fetch latest audit data for defaults
  const fetchStartTime = performance.now();
  let auditData: EnergyAuditData | null = null;
  
  try {
    auditData = await fetchLatestAuditData();
    
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "fetchLatestAuditData",
      correlation: {
        request_id: requestId,
        user_id: userId,
        audit_id: auditData?.id || 'not-found'
      },
      details: {
        success: !!auditData,
        audit_found: !!auditData,
        audit_date: auditData?.basicInfo?.auditDate
      },
      performance: {
        duration_ms: Math.round(performance.now() - fetchStartTime)
      }
    }));
  } catch (error) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      component: "userProfileService",
      operation: "fetchLatestAuditData",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        stack_trace: error instanceof Error ? error.stack : undefined,
        success: false
      },
      performance: {
        duration_ms: Math.round(performance.now() - fetchStartTime)
      }
    }));
  }
  
  if (!auditData) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "userProfileService",
      operation: "populatePropertySettings.complete",
      correlation: {
        request_id: requestId,
        user_id: userId
      },
      details: {
        success: false,
        reason: "no_audit_data_available",
        auto_populated: false
      },
      performance: {
        duration_ms: Math.round(performance.now() - startTime)
      }
    }));
    return profileData;
  }
  
  // Extract property settings from audit data
  const extractStartTime = performance.now();
  const defaultSettings = await extractPropertySettingsFromAudit(auditData);
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    component: "userProfileService",
    operation: "extractPropertySettings",
    correlation: {
      request_id: requestId,
      user_id: userId,
      audit_id: auditData.id
    },
    details: {
      success: Object.keys(defaultSettings).length > 0,
      extracted_field_count: Object.keys(defaultSettings).length,
      extracted_property_type: defaultSettings.propertyDetails?.propertyType,
      extraction_summary: {
        has_property_details: !!defaultSettings.propertyDetails,
        has_window_maintenance: !!defaultSettings.windowMaintenance,
        has_energy_systems: !!defaultSettings.energySystems
      }
    },
    performance: {
      duration_ms: Math.round(performance.now() - extractStartTime)
    }
  }));
  
  // Merge defaults with existing profile data (without overwriting)
  const before = { ...profileData };
  const updatedProfile = {
    ...profileData,
    ...defaultSettings
  };
  
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    component: "userProfileService",
    operation: "populatePropertySettings.complete",
    correlation: {
      request_id: requestId,
      user_id: userId,
      audit_id: auditData.id
    },
    details: {
      success: true,
      auto_populated: true,
      source: "latest_audit",
      audit_date: auditData.basicInfo?.auditDate,
      populated_fields: Object.keys(defaultSettings),
      property_type: defaultSettings.propertyDetails?.propertyType,
      before: {
        had_property_details: !!before.propertyDetails,
        had_window_maintenance: !!before.windowMaintenance,
        had_energy_systems: !!before.energySystems
      },
      after: {
        has_property_details: !!updatedProfile.propertyDetails,
        has_window_maintenance: !!updatedProfile.windowMaintenance,
        has_energy_systems: !!updatedProfile.energySystems,
        property_type: updatedProfile.propertyDetails?.propertyType,
        year_built: updatedProfile.propertyDetails?.yearBuilt,
        square_footage: updatedProfile.propertyDetails?.squareFootage
      }
    },
    performance: {
      total_duration_ms: Math.round(performance.now() - startTime),
      fetch_audit_ms: Math.round(fetchStartTime - startTime),
      extract_settings_ms: Math.round(extractStartTime - fetchStartTime)
    }
  }));
  
  return updatedProfile;
}

// Helper function to generate a UUID for request correlation
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper function to hash a string for anonymization
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}
