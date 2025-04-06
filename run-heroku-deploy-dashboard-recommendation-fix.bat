@echo off
echo ========================================================
echo  Dashboard Recommendation Fixes Deployment
echo ========================================================
echo.
echo This script will deploy the dashboard recommendations fix to Heroku
echo.

rem Run the deployment script
node scripts/heroku_deploy_dashboard_recommendation_fix.js

echo.
if %errorlevel% neq 0 (
  echo Deployment failed with error code %errorlevel%
  echo Please check the logs above for details.
) else (
  echo Deployment completed successfully!
  echo Open https://energy-audit-store-e66479ed4f2b.herokuapp.com/dashboard to verify
)

echo.
echo Press any key to exit...
pause > nul
