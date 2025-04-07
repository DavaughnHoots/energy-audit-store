@echo off
echo ======================================================
echo Deploying Dashboard Financial Data Field Mapping Fix
echo ======================================================

node scripts/heroku_deploy_dashboard_financial_mapping_fix.js

echo.
echo If deployment was successful, please verify the financial data 
echo is correctly displayed in the dashboard charts.
echo.
pause
