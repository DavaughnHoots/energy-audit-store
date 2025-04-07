@echo off
echo === Dashboard Infinite Loop Fix Deployment ===
echo This script will deploy the fix for the dashboard infinite API calls issue
echo.

echo Running deployment script...
node scripts/heroku_deploy_dashboard_infinite_loop_fix.js

if %ERRORLEVEL% NEQ 0 (
  echo Deployment failed. See error messages above.
  exit /b %ERRORLEVEL%
)

echo.
echo === Deployment Complete ===
echo Visit https://energy-audit-store-e66479ed4f2b.herokuapp.com/ to verify the changes
echo.
pause
