@echo off
echo Running Dashboard Redirect Deployment

node scripts/heroku_deploy_dashboard_redirect.js

echo.
echo Deployment script execution completed.
echo.
pause
