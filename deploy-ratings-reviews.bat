@echo off
echo ===== Deploying Education Ratings ^& Reviews Features =====

echo.
echo Step 2: Pushing to Heroku (without migrations)...
git push heroku education-rating-reviews:main

echo.
echo ===== Deployment Complete =====
echo.
echo To verify the deployment:
echo 1. Visit https://energy-audit-store.herokuapp.com
echo 2. Check Heroku logs: heroku logs --tail
