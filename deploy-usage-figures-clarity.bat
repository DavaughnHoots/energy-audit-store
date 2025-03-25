@echo off
echo ===== Deploying Usage Figures Clarity Improvements to Heroku =====

echo.
echo 1. Committing changes to git...
git add usage_figures_clarity_implementation.txt
git add usage_figures_clarity_implementation.js
git add test-usage-figures-clarity.js

git commit -m "Add Usage Figures Clarity improvements to energy audit reports"

echo.
echo 2. Pushing to Heroku...
git push heroku fix-usage-figures-clarity:main

echo.
echo 3. Testing deployment...
heroku run node test-usage-figures-clarity.js

echo.
echo Deployment complete!
echo ====================================================
echo.
echo Usage Figures Clarity improvements have been deployed.
echo These improvements add:
echo - Energy Use Intensity (EUI) metrics for better comparison
echo - Improved number formatting for better readability
echo - Detailed explanations of energy conversion factors
echo - Better context for energy usage figures
echo - Clear explanations of power factors and other technical terms
echo.
echo To verify the changes, generate a new energy audit report.
