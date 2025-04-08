# Property Settings Logging Improvements

## Overview
This document describes the enhanced logging implementation for the property settings API interactions. These improvements have been added to better diagnose issues with property settings and window settings data submission.

## Changes Made

### 1. Enhanced Property Settings Request/Response Logging
- Added detailed logging of the full property settings data payload before submission
- Added structured logging of request/response headers, status codes, and response bodies
- Improved error message clarity with HTTP status codes included
- Added separate console log groups for easy identification in browser dev tools

### 2. Enhanced Window Settings Request/Response Logging
- Added detailed logging of the window data payload before submission
- Added structured logging of request/response headers, status codes, and response bodies
- Improved error message clarity with HTTP status codes included
- Added windowType field tracking to help identify window-specific data issues

### 3. Response Text Parsing and Error Handling
- Added response text parsing with fallback for non-JSON responses
- Improved error handling to capture and log the complete response information
- Enhanced error display with more specific error messages for users

## How to Use the Enhanced Logs

### For Debugging Property Settings Issues:
1. Look for logs with the prefix "PROPERTY DETAILS SAVE PAYLOAD" to see the exact data being sent
2. Look for logs with the prefix "PROPERTY SETTINGS - Request payload" for the formatted JSON
3. Check "PROPERTY SETTINGS - Response" for server response details, including headers and status code
4. If an error occurred, "PROPERTY SETTINGS - Error details" will contain the full error information

### For Debugging Window Settings Issues:
1. Look for logs with the prefix "WINDOW DATA SAVE PAYLOAD" to see the exact data being sent
2. Look for logs with the prefix "WINDOW SETTINGS - Request payload" for the formatted JSON
3. Check "WINDOW SETTINGS - Response" for server response details
4. If an error occurred, "WINDOW SETTINGS - Error details" will contain the full error information

## Example Log Output

### Property Settings Success:
```
PROPERTY DETAILS SAVE PAYLOAD: {
  "propertyType": "singleFamily",
  "squareFootage": 2200,
  "yearBuilt": 1985
  ... other fields ...
}

PROPERTY SETTINGS - Request payload: {
  "propertyType": "singleFamily",
  "squareFootage": 2200,
  "yearBuilt": 1985
  ... other fields ...
}

PROPERTY SETTINGS - Response: {
  status: 200,
  statusText: "OK",
  headers: { ... },
  body: { ... result object ... }
}
```

### Property Settings Error:
```
PROPERTY SETTINGS - Error details: {
  status: 400,
  statusText: "Bad Request",
  data: { error: "Invalid property type" }
}
```

## Future Improvements

1. Add client-side validation before API submission to catch common errors
2. Add support for logging weatherization data submissions
3. Add performance tracking for API requests
4. Implement retry logic for intermittent failures
