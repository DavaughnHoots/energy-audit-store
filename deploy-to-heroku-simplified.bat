@echo off
echo ===== Deploying to Heroku =====

echo.
echo 1. Adding files to git...
git add lighting_data_normalization_implementation.txt
git add lighting_data_normalization_implementation.js
git add test-lighting-data-normalization.js
git add energy_audit_report_improvements.txt

echo.
echo 2. Committing changes...
git commit -m "Add Lighting Data Normalization improvements to energy audit reports"

echo.
echo 3. Pushing to origin (optional - press Ctrl+C to skip)...
git push origin

echo.
echo 4. Pushing to Heroku...
git push heroku main

echo.
echo 5. Testing deployment...
heroku run node test-lighting-data-normalization.js

echo.
echo Deployment complete!
echo ====================================================
