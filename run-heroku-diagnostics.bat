@echo off
REM Batch script to run analytics diagnostics on Heroku from Windows
REM This script avoids issues with spaces in paths and quotes

echo Running analytics diagnostics on Heroku...
echo.

REM Try to run the command using various methods
echo Trying to execute with npx...
call npx heroku run "node scripts/heroku_check_analytics.js" --app energy-audit-store

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo First method failed, trying alternate approach...
  echo.
  
  REM Try direct execution - this may work if Heroku CLI is in PATH
  heroku run "node scripts/heroku_check_analytics.js" --app energy-audit-store
)

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Both approaches failed. Please make sure Heroku CLI is installed correctly.
  echo You can try running this command manually in Git Bash or PowerShell:
  echo.
  echo heroku run 'node scripts/heroku_check_analytics.js' --app energy-audit-store
  echo.
)

echo.
pause
