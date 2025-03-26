@echo off
echo ====================================
echo Energy Audit ES Module Test Runner
echo ====================================

if "%1"=="" (
  echo Usage: run-es-module-tests.bat test-script-file.mjs
  echo Example: run-es-module-tests.bat test-hvac-metrics-explanation.mjs
  exit /b 1
)

echo Running ES Module test: %1
node %1
echo.
echo Test completed!
