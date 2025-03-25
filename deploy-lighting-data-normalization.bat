@echo off
echo ===== Deploying Lighting Data Normalization Improvements to Heroku =====

echo.
echo 1. Committing changes to git...
git add lighting_data_normalization_implementation.txt
git add lighting_data_normalization_implementation.js
git add test-lighting-data-normalization.js

git commit -m "Add Lighting Data Normalization improvements to energy audit reports"

echo.
echo 2. Pushing to Heroku...
git push heroku fix-lighting-data-normalization:main

echo.
echo 3. Testing deployment...
heroku run node test-lighting-data-normalization.js

echo.
echo Deployment complete!
echo ====================================================
echo.
echo Lighting Data Normalization improvements have been deployed.
echo These improvements add:
echo - Accurate bulb type descriptions based on percentage data
echo - Percentage normalization to always sum to 100%%
echo - Intelligent defaults based on property age when data is missing
echo - Clear indication when estimated values are used
echo - Improved lighting efficiency energy savings calculations
echo.
echo To verify the changes, generate a new energy audit report.
