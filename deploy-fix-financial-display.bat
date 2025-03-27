@echo off
echo ===== Deploying Financial Data Display Fix =====
echo.

REM Make sure we're on the right branch
echo Checking branch...
git rev-parse --abbrev-ref HEAD | findstr "fix-financial-data-display" >nul 2>&1
if %errorlevel% neq 0 (
  echo Error: Not on fix-financial-data-display branch!
  echo Please switch to the fix-financial-data-display branch first.
  exit /b 1
)

REM Check for uncommitted changes
echo Checking for uncommitted changes...
git diff-index --quiet HEAD -- || (
  echo Warning: You have uncommitted changes!
  echo Please commit all changes before deploying.
  
  REM Ask to continue
  set /p CONTINUE="Do you want to continue anyway? (y/n): "
  if /i "%CONTINUE%" neq "y" exit /b 1
)

REM Commit any pending changes (if any)
set /p COMMIT_MSG="Enter commit message (or press enter to skip): "
if not "%COMMIT_MSG%"=="" (
  git add .
  git commit -m "%COMMIT_MSG%"
)

REM First build the frontend to make sure it works
echo Building frontend...
call npm run build

if %errorlevel% neq 0 (
  echo Error: Frontend build failed!
  exit /b 1
)

REM Push to Heroku
echo Deploying to Heroku...
git push heroku fix-financial-data-display:main -f

if %errorlevel% neq 0 (
  echo Error: Deployment to Heroku failed!
  exit /b 1
)

echo.
echo ===== Deployment Complete =====
echo The financial data display fix has been deployed to Heroku.
echo Check the application to verify the fix.
echo.
