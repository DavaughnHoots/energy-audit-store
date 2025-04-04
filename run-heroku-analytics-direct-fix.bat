@echo off
echo ======================================================
echo    Running Analytics Fix Deployment on Heroku
echo    (Direct backend script)
echo ======================================================
echo.

REM Set the Heroku app name - change this if needed
set HEROKU_APP=energy-audit-store-e66479ed4f2b

echo Deploying analytics fix to Heroku app: %HEROKU_APP%
echo.

REM Run the analytics fix script on Heroku
echo Running analytics fix script on Heroku...
heroku run "node backend/src/scripts/analytics_fix.js" --app %HEROKU_APP%

echo.
echo ======================================================
echo    Deployment process complete
echo ======================================================
echo.
echo Check the output above for any errors or success messages.
echo.

pause
