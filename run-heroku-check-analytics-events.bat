@echo off
echo Checking analytics events in Heroku database...
node scripts/heroku_check_analytics_events.js
pause
