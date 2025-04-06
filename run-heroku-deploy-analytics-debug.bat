@echo off
echo Running analytics tracking debug deployment to Heroku...
echo WARNING: This will OVERRIDE your current Heroku deployment with the debug version!
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul
node scripts/heroku_deploy_analytics_tracking_debug.js
pause
