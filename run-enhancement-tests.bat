@echo off
echo ====================================
echo Energy Audit Enhancement Tests
echo ====================================

echo Compiling TypeScript files...
cd backend
call npx tsc
cd ..

echo.
echo Running Usage Hours Validator tests...
node test-usage-hours-validator.mjs

echo.
echo Running HVAC Metrics Explanation tests...
node test-hvac-metrics-explanation.mjs

echo.
echo All tests completed!
pause
