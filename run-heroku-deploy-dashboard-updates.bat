@echo off
echo Starting Dashboard Redesign Deployment...
node scripts/heroku_deploy_dashboard_updates.js
echo.
echo If the script completed successfully, the dashboard redesign has been deployed.
echo If you encountered errors, please check the output above for more information.
pause
