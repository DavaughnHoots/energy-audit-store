@echo off
echo ======================================================
echo    Running Analytics Tables Migration on Heroku
echo ======================================================
echo.

REM Set the Heroku app name
set HEROKU_APP=energy-audit-store

echo Deploying analytics tables migration to Heroku app: %HEROKU_APP%
echo.

REM Run the migration on Heroku
echo Running migration on Heroku...
heroku run "node backend/src/scripts/run_analytics_tables_migration.js" --app %HEROKU_APP%

echo.
echo ======================================================
echo    Migration process complete
echo ======================================================
echo.
echo Check the output above for any errors or success messages.
echo.

pause
