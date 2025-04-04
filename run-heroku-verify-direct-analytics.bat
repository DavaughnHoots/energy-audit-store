@echo off
echo ======================================================
echo        Verifying Direct Analytics Event Sending
echo ======================================================
echo.
echo This script will verify that direct analytics events
echo are properly saved to the database on Heroku.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Running verification script on Heroku...
echo.

heroku run node scripts/heroku_verify_direct_analytics.js

echo.
echo ======================================================
echo Verification complete. If all tests passed, the direct
echo analytics event sending implementation is working.
echo ======================================================
echo.
echo If any errors occurred, check:
echo 1. Database tables (analytics_events, analytics_sessions)
echo 2. UUID type handling in PostgreSQL queries
echo 3. API endpoint /api/analytics/event
echo.
pause
