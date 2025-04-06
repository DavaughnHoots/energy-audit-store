@echo off
echo Running Admin Dashboard Fix Deployment Script...
node scripts/heroku_deploy_admin_fix.js
echo.
echo Script execution completed. Now commit and push the changes to Heroku.
echo git add backend/build/services/AnalyticsService.enhanced.js backend/build/routes/admin.enhanced.js backend/build/server.js
echo git commit -m "Deploy admin dashboard analytics fix"
echo git push heroku HEAD:main
