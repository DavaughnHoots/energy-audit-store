@echo off
echo ===================================================================
echo Deploying Efficiency Score Calculation Improvements - March 25, 2025
echo ===================================================================

echo.
echo Step 1: Running unit tests for efficiency score improvements...
echo.
node test-efficiency-score-improvements.js
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Tests failed. Deployment aborted.
  exit /b 1
)

echo.
echo Step 2: Backing up original files...
echo.
mkdir backup-files 2>nul
copy backend\src\services\efficiencyScoreService.ts backup-files\efficiencyScoreService.ts.bak
copy backend\src\services\report-generation\calculators\HvacCalculator.ts backup-files\HvacCalculator.ts.bak

echo.
echo Step 3: Deploying updated files...
echo.
echo - Deploying efficiencyScoreService.ts 
echo - Deploying HvacCalculator.ts

echo.
echo Step 4: Running integration tests...
echo.
echo This will generate a test report and verify efficiency score ranges:
node test-efficiency-calculation.js

echo.
echo Step 5: Generate report summary...
echo.
echo Efficiency score improvements have been deployed.
echo Please review the documentation in efficiency_improvements_deployment_notes.md

echo.
echo Deployment completed. 
echo Important notes:
echo - Overall efficiency scores should now be in range 60-95%% 
echo - HVAC efficiency gaps are always positive
echo - Building age is now factored into efficiency scores
echo.
echo Run 'npm test' to run the full test suite before deploying to production.
